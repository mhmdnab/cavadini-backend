import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  productId: number;
  quantity: number;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId | null;
  sessionId: string | null;
  items: ICartItem[];
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    sessionId: { type: String, default: null },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.index({ userId: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });

export default mongoose.model<ICart>('Cart', cartSchema);
