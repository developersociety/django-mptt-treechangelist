var TreeChangelist = {};

/*global django:true */

(function($) {
    var tree_structure,
        csrf_token,
        current_root_level = null;

    // Called from change_list.html
    TreeChangelist.setup_structure = function(structure) {
        tree_structure = structure;
    };

    TreeChangelist.csrf_token = function(token) {
        csrf_token = token;
    };


    // Cookie settings
    var cookie_name = "expanded_nodes",
        cookie_options = {expires: 7};


    // Retrieve all expanded nodes from a cookie
    function get_expanded_nodes() {
        var nodes = $.cookie(cookie_name);
        if (nodes !== null) {
            try {
                nodes = $.parseJSON(nodes);
            } catch(e) {
                nodes = [];
            }
        } else {
            nodes = [];
        }
        return nodes;
    }
    var expanded_nodes = get_expanded_nodes();

    // Save all expanded nodes to a cookie, or unset it if no nodes are expanded
    function save_expanded_nodes() {
        if (expanded_nodes.length) {
            $.cookie(cookie_name, "[" + expanded_nodes.join(",") + "]", cookie_options);
        } else {
            $.cookie(cookie_name, null, cookie_options);
        }
    }

    // Add a node to the expanded list
    function add_expanded_node(node_id) {
        if ($.inArray(node_id, expanded_nodes) === -1) {
            expanded_nodes.push(node_id);
        }
        save_expanded_nodes();
    }

    // Remove a node from the expanded list
    function remove_expanded_node(node_id) {
        var remove_index = $.inArray(node_id, expanded_nodes);
        if (remove_index > -1) {
            expanded_nodes.splice(remove_index, 1);
        }
        save_expanded_nodes();
    }


    // List of pages, other settings
    var page_list,
        tree_item_prefix = "#tree_item_",
        tree_expanded_class = "tree_expanded",
        node_visible_class = "tree_node_visible";


    // Restyle all visible table rows according to visible items
    function update_oddeven() {
        var visible_items = page_list.filter(":visible"),
            row1_class = "row1",
            row2_class = "row2";

        visible_items.filter(":odd").removeClass(row1_class).addClass(row2_class);
        visible_items.filter(":even").removeClass(row2_class).addClass(row1_class);
    }


    // Recursively hide all child nodes in the tree
    function hide_child_nodes(node_id) {
        var node = tree_structure[node_id];

        if (node.c.length) {
            $.each(node.c, function(id, show_node) {
                hide_child_nodes(show_node);
                $(tree_item_prefix + show_node).removeClass(node_visible_class);
            });
        }
    }

    // Show all child nodes, and recursively show all which were visible before
    function show_child_nodes(node_id) {
        var node = tree_structure[node_id];

        if (node.c.length) {
            $.each(node.c, function(id, show_node) {
                var node = $(tree_item_prefix + show_node);
                node.addClass(node_visible_class);

                if (node.hasClass(tree_expanded_class)) {
                    show_child_nodes(show_node);
                }
            });
        }
    }

    // Called whenever a user wants to expand/hide a tree
    function tree_expand(event) {
        event.preventDefault();

        var node_id = event.data.id,
            expanded = $(tree_item_prefix + node_id).hasClass(tree_expanded_class);

        $(tree_item_prefix + node_id).toggleClass(tree_expanded_class);

        if (!expanded) {
            add_expanded_node(node_id);
            show_child_nodes(node_id);
        } else {
            remove_expanded_node(node_id);
            hide_child_nodes(node_id);
        }

        update_oddeven();
    }


    // Click up/down/left/right
    function tree_actions_move(event) {
        event.preventDefault();

        $("#tree_changelist_form_node").val($(this).val());
        $("#tree_changelist_form_move").val(event.data.direction);
        $("#tree_changelist_form").submit();
    }


    // Populated on load
    function update_tree_node(idx, elem) {
        var actions_id = parseInt($(elem).find(".tree_actions").attr("id").replace("tree_actions_", ""), 10),
            first_th  = $(elem).find("th").first(),
            node = tree_structure[actions_id];
        if(current_root_level === null || node.l < current_root_level) {
            current_root_level = node.l;
        }

        $(elem).attr("id", "tree_item_"+actions_id);

        var margin = node.l * 18;

        // Leaf node, or node with children
        if (!node.c.length) {
            first_th.prepend('<div class="tree_leaf" style="margin-left: '+margin+'px;"></div>');
        } else {
            first_th.prepend('<a class="tree_expand" style="margin-left: '+margin+'px;" href="#">Test</a>')
                .find(".tree_expand").bind("click", {id: actions_id}, tree_expand);
        }

        // Show all root nodes
        if (node.l == current_root_level) {
            // It's a "relative root node"
            // i.e. the root for its tree on this page
            node.r = true;
            $(elem).addClass(node_visible_class);
        }
    }


    $().ready(function() {
        var result_list = $("#result_list");
        page_list = result_list.find("tbody tr");

        // Populate the IDs for all items, and add in required elements
        page_list.each(update_tree_node);

        // Populate all expanded nodes
        $.each(expanded_nodes, function(idx, node_id) {
            $(tree_item_prefix + node_id).addClass(tree_expanded_class);
        });

        // Expand all root nodes which are already marked as expanded
        $.each(expanded_nodes, function(idx, node_id) {
            var node = tree_structure[node_id];

            if (node.r === true) {
                show_child_nodes(node_id);
            }
        });

        var actions_prefix = ".tree_actions_";

        result_list.delegate(actions_prefix + "up", "click", {direction: 1}, tree_actions_move)
            .delegate(actions_prefix + "down", "click", {direction: 2}, tree_actions_move)
            .delegate(actions_prefix + "left", "click", {direction: 3}, tree_actions_move)
            .delegate(actions_prefix + "right", "click", {direction: 4}, tree_actions_move);

        update_oddeven();
    });

})(django.jQuery);
