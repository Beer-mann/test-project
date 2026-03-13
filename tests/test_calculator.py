from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from calculator import add, divide, multiply, subtract


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (2, 3, 5),
        (2.5, 0.5, 3.0),
    ],
)
def test_add_returns_sum(left, right, expected):
    assert add(left, right) == expected


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (10, 3, 7),
        (2.5, 0.5, 2.0),
    ],
)
def test_subtract_returns_difference(left, right, expected):
    assert subtract(left, right) == expected


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (4, 5, 20),
        (2.5, 2, 5.0),
    ],
)
def test_multiply_returns_product(left, right, expected):
    assert multiply(left, right) == expected


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (9, 3, 3),
        (7.5, 2.5, 3.0),
    ],
)
def test_divide_returns_quotient(left, right, expected):
    assert divide(left, right) == expected


@pytest.mark.parametrize("operation", [add, subtract, multiply, divide])
@pytest.mark.parametrize(
    ("left", "right"),
    [
        (True, 1),
        (1, False),
        ("1", 2),
        (1, None),
    ],
)
def test_operations_reject_non_numeric_inputs(operation, left, right):
    with pytest.raises(ValueError):
        operation(left, right)


def test_divide_rejects_zero_division():
    with pytest.raises(ZeroDivisionError):
        divide(5, 0)
