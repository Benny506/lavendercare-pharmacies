import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  hasLoaded: false,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.hasLoaded = true;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      if (order) {
        order.order_status = status;
      }
    }
  }
});

export const { setOrders, updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
