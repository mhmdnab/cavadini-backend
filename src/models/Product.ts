import mongoose, { Schema } from 'mongoose';

export interface IFeature {
  title: string;
  body: string;
}

// Note: 'collection' is omitted from Document extension to avoid conflict with
// Mongoose's built-in Document.collection (the MongoDB collection reference).
export interface IProduct {
  id: number;
  name: string;
  collection: string;
  collectionSlug: string;
  price: string;
  priceValue: number;
  ref: string;
  movement: string;
  gradient: string;
  tagline: string;
  description: string;
  caseDiameter: string;
  caseHeight: string;
  caseMaterial: string;
  bracelet: string;
  waterResistance: string;
  powerReserve: string;
  frequency: string;
  jewels: string;
  functions: string[];
  features: IFeature[];
  inStock: boolean;
  stockCount: number;
}

const featureSchema = new Schema<IFeature>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    collection: { type: String, required: true },
    collectionSlug: { type: String, required: true },
    price: { type: String, required: true },
    priceValue: { type: Number, required: true },
    ref: { type: String, required: true },
    movement: { type: String, required: true },
    gradient: { type: String, required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    caseDiameter: { type: String, required: true },
    caseHeight: { type: String, required: true },
    caseMaterial: { type: String, required: true },
    bracelet: { type: String, required: true },
    waterResistance: { type: String, required: true },
    powerReserve: { type: String, required: true },
    frequency: { type: String, required: true },
    jewels: { type: String, required: true },
    functions: [{ type: String }],
    features: [featureSchema],
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 10 },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', productSchema);
