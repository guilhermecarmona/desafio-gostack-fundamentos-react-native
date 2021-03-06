import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@gomarketplace:cart');
      const cartProducts = cart ? JSON.parse(cart) : [];
      setProducts([...cartProducts]);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const findProductIdx = products.findIndex(
        cartProduct => cartProduct.id === product.id,
      );
      let newCart = [...products];
      if (findProductIdx > -1) {
        newCart.splice(findProductIdx, 1, {
          ...newCart[findProductIdx],
          quantity: newCart[findProductIdx].quantity + 1,
        });
      } else {
        newCart = [...newCart, { ...product, quantity: 1 }];
      }
      await AsyncStorage.setItem(
        '@gomarketplace:cart',
        JSON.stringify(newCart),
      );
      setProducts(newCart);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const findProductIdx = products.findIndex(product => product.id === id);
      if (findProductIdx < 0) return;
      const cartProducts = [...products];
      cartProducts.splice(findProductIdx, 1, {
        ...cartProducts[findProductIdx],
        quantity: cartProducts[findProductIdx].quantity + 1,
      });
      await AsyncStorage.setItem(
        '@gomarketplace:cart',
        JSON.stringify(cartProducts),
      );
      setProducts(cartProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProductIdx = products.findIndex(product => product.id === id);
      if (findProductIdx < 0) return;
      const cartProducts = [...products];
      const quantity =
        cartProducts[findProductIdx].quantity <= 1
          ? cartProducts[findProductIdx].quantity
          : cartProducts[findProductIdx].quantity - 1;
      cartProducts.splice(findProductIdx, 1, {
        ...cartProducts[findProductIdx],
        quantity,
      });
      await AsyncStorage.setItem(
        '@gomarketplace:cart',
        JSON.stringify(cartProducts),
      );
      setProducts(cartProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
