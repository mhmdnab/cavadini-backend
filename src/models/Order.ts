import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: number;
  name: string;
  price: string;
  priceValue: number;
  quantity: number;
}

export interface IShippingAddress {
  fullName?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  shippingAddress?: IShippingAddress;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    priceValue: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: String,
    address: String,
    city: String,
    country: String,
    postalCode: String,
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered'],
      default: 'pending',
    },
    shippingAddress: shippingAddressSchema,
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', orderSchema);
