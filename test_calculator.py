import pytest

from calculator import add, multiply


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (2, 3, 5),
        (2.5, 0.5, 3.0),
        (-4, 10, 6),
    ],
)
def test_add_returns_sum_for_numeric_inputs(left, right, expected):
    assert add(left, right) == expected


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (2, 3, 6),
        (2.5, 0.5, 1.25),
        (-4, 10, -40),
    ],
)
def test_multiply_returns_product_for_numeric_inputs(left, right, expected):
    assert multiply(left, right) == expected


@pytest.mark.parametrize(
    ("function", "left", "right"),
    [
        (add, "2", 3),
        (add, None, 3),
        (multiply, 2, "3"),
        (multiply, 2, object()),
    ],
)
def test_operations_reject_non_numeric_inputs(function, left, right):
    with pytest.raises(ValueError, match="Both inputs must be numbers"):
        function(left, right)
