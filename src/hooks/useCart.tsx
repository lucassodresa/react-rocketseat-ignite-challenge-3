import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    // TODO
    try {
      // get available stock and info to selected product
      const [product, productStock]: [Product, Stock] = await Promise.all([
        api.get(`/products/${productId}`).then((response) => response.data),
        api.get(`/stock/${productId}`).then((response) => response.data),
      ]);

      console.log(productId);

      // verify if product already exist in chart
      const productInChart = cart.find((product) => product.id === productId);

      //verify if has stock
      const productStockQuantityRemaining = productInChart
        ? productStock.amount - productInChart.amount
        : productStock.amount;

      if (productStockQuantityRemaining <= 0) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      // update value in chart
      if (productInChart) {
        productInChart.amount += 1;
        const newCart = [...cart];
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        const newProduct = { ...product, amount: 1 };
        const newCart = [...cart, { ...newProduct }];
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const newCart = cart.filter((product) => product.id !== productId);
      if (newCart.length === cart.length) throw new Error();
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      if (amount <= 0) return;

      // get info to selected product

      const productStock = await api
        .get<Stock>(`/stock/${productId}`)
        .then((response) => response.data);

      // verify if product already exist in chart

      if (amount > productStock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productInChart = cart.find((product) => product.id === productId);
      if (!productInChart) throw new Error();
      productInChart.amount = amount;

      const newCart = [...cart];
      setCart(newCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  // useEffect(() => {

  // }, [cart]);

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
