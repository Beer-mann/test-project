def add(a, b):
    # TODO: Add input validation for the add and multiply functions
    if not (isinstance(a, (int, float)) and isinstance(b, (int, float))):
        raise ValueError("Both inputs must be numbers")
    return a + b

def multiply(a, b):
    # TODO: Add input validation for the add and multiply functions
    if not (isinstance(a, (int, float)) and isinstance(b, (int, float))):
        raise ValueError("Both inputs must be numbers")
    return a * b
