import pytest

from calculator import add, multiply


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (2, 3, 5),
        (1.5, 2.5, 4.0),
        (-4, 10, 6),
    ],
)
def test_add_returns_sum_for_numeric_inputs(left, right, expected):
    assert add(left, right) == expected


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (2, 3, 6),
        (1.5, 2, 3.0),
        (-4, -5, 20),
    ],
)
def test_multiply_returns_product_for_numeric_inputs(left, right, expected):
    assert multiply(left, right) == expected


@pytest.mark.parametrize(
    ("func", "left", "right"),
    [
        (add, "2", 3),
        (add, 2, None),
        (multiply, [], 3),
        (multiply, 2, {}),
    ],
)
def test_operations_reject_non_numeric_inputs(func, left, right):
    with pytest.raises(ValueError, match="Both inputs must be numbers"):
        func(left, right)
