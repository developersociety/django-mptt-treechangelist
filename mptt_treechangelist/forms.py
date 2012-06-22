from django import forms


class MoveNodeForm(forms.Form):
    MOVE_UP = 1
    MOVE_DOWN = 2
    MOVE_LEFT = 3
    MOVE_RIGHT = 4

    move = forms.IntegerField(min_value=MOVE_UP, max_value=MOVE_RIGHT)
