from django.contrib import admin
from django.contrib.admin.views.main import ChangeList
from django.http import HttpResponseRedirect
from simplejson.encoder import JSONEncoderForHTML
from mptt_treechangelist.forms import MoveNodeForm


class TreeChangeList(ChangeList):
    """
    Custom ``ChangeList`` class which ensures that the tree entries are always
    ordered in depth-first order (order by ``tree_id``, ``lft``).
    """

    def get_query_set(self, *args, **kwargs):
        return super(TreeChangeList, self).get_query_set(*args, **kwargs).order_by('tree_id', 'lft')


def _build_tree_structure(cls):
    all_nodes = {}
    mptt_opts = cls._mptt_meta

    for node_id, parent_id, level in cls.objects.order_by(mptt_opts.tree_id_attr, mptt_opts.left_attr).values_list('pk', '%s_id' % mptt_opts.parent_attr, 'level'):
        if parent_id:
            if parent_id not in all_nodes:
                all_nodes[parent_id] = {'c': []}

            all_nodes[parent_id]['c'].append(node_id)

        if node_id not in all_nodes:
            all_nodes[node_id] = {'c': []}

        all_nodes[node_id]['l'] = level

        if not parent_id:
            all_nodes[node_id]['r'] = True

    return all_nodes


class TreeModelAdmin(admin.ModelAdmin):
    change_list_template = 'admin/tree_change_list.html'
    actions = None

    def __init__(self, *args, **kwargs):
        super(TreeModelAdmin, self).__init__(*args, **kwargs)

        # Ensure we have the actions column
        if 'actions_column' not in self.list_display:
            self.list_display += ('actions_column',)

    def changelist_view(self, request, extra_context=None, *args, **kwargs):
        """
        Handle the changelist view, the django view for the model instances
        change list/actions page.
        """

        # Handle tree move requests
        tree_action = request.POST.get('_tree_action', '')

        if tree_action == 'move':
            return self.move_node(request)

        extra_context = extra_context or {}
        extra_context['tree_structure'] = JSONEncoderForHTML().encode(_build_tree_structure(self.model))
        return super(TreeModelAdmin, self).changelist_view(request, extra_context, *args, **kwargs)

    def move_node(self, request):
        try:
            node_obj = self.model.objects.get(pk=request.POST.get('node_id'))
        except:
            return HttpResponseRedirect(request.path)

        form = MoveNodeForm(request.POST)

        if not form.is_valid():
            return HttpResponseRedirect(request.path)

        move = form.cleaned_data['move']

        if move == MoveNodeForm.MOVE_UP:
            sibling = node_obj.get_previous_sibling()
            if sibling is not None:
                node_obj.move_to(sibling, 'left')

        elif move == MoveNodeForm.MOVE_DOWN:
            sibling = node_obj.get_next_sibling()
            if sibling is not None:
                node_obj.move_to(sibling, 'right')

        elif move == MoveNodeForm.MOVE_LEFT:
            parent = node_obj.parent
            if parent is not None:
                node_obj.move_to(parent, 'right')

        elif move == MoveNodeForm.MOVE_RIGHT:
            sibling = node_obj.get_previous_sibling()
            if sibling is not None:
                node_obj.move_to(sibling, 'last-child')

        return HttpResponseRedirect(request.path)

    def _actions_column(self, instance):
        return ["""<div class="tree_actions" id="tree_actions_{id}"></div>
        <button type="button" value="{id}" class="tree_actions_up">Up</button>
        <button type="button" value="{id}" class="tree_actions_down">down</button>
        <button type="button" value="{id}" class="tree_actions_left">left</button>
        <button type="button" value="{id}" class="tree_actions_right">right</button>
        """.format(id=instance.id)]

    def actions_column(self, instance):
        return u' '.join(self._actions_column(instance))
    actions_column.allow_tags = True
    actions_column.short_description = 'actions'
