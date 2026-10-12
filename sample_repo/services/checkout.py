from services.pricing import calculate_subtotal, apply_discount


def create_checkout(price: float, quantity: int, discount_percent: float) -> dict:
    subtotal = calculate_subtotal(price, quantity)
    total = apply_discount(subtotal, discount_percent)

    return {
        "subtotal": subtotal,
        "total": total,
    }