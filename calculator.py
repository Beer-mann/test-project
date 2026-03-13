def _validate_numbers(a, b):
    if isinstance(a, bool) or isinstance(b, bool):
        raise ValueError("Boolean values are not supported")

    if not (isinstance(a, (int, float)) and isinstance(b, (int, float))):
        raise ValueError("Both inputs must be numbers")


def add(a, b):
    _validate_numbers(a, b)
    return a + b


def subtract(a, b):
    _validate_numbers(a, b)
    return a - b


def multiply(a, b):
    _validate_numbers(a, b)
    return a * b


def divide(a, b):
    _validate_numbers(a, b)
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b
