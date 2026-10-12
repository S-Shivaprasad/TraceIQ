from services.checkout import create_checkout


def main() -> None:
    order = create_checkout(100.0, 2, 10.0)
    print(order)


if __name__ == "__main__":
    main()