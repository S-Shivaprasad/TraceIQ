
import unittest

from services.checkout import create_checkout


class TestCheckout(unittest.TestCase):
    def test_checkout_applies_discount(self):
        result = create_checkout(100.0, 2, 10.0)

        self.assertEqual(result["subtotal"], 200.0)
        self.assertEqual(result["total"], 180.0)


if __name__ == "__main__":
    unittest.main()
