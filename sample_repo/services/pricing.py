def calculate_subtotal(price: float, quantity: int) -> float:
    return price * quantity


def apply_discount(subtotal: float, discount_percent: float) -> float:
    return subtotal * (1 - discount_percent / 100)