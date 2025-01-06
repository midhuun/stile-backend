const mongoose = require("mongoose");
const { Schema } = mongoose;
const validator = require("validator");
const slugify = require("slugify"); // Install using npm install slugify

// Category Schema
const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      minLength: [4, "Category must be more than 4 characters"],
      maxLength: [30, "Category must not be more than 30 characters"],
    },
    slug: {
      type: String,
      trim: true,
    },
    startingPrice: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      validate: (value) => {
        if (!validator.isURL(value)) {
          throw new Error("Image URL is not valid");
        }
      },
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],
  },
  { timestamps: true }
);

// Update slug on name change
CategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const CategoryModel = mongoose.model("Category", CategorySchema);

// Subcategory Schema
const SubcategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: [4, "Subcategory name must be more than 4 characters"],
      maxLength: [30, "Subcategory name must not be more than 30 characters"],
    },
    slug: {
      type: String,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    sizeurl:{
      type: String,
      validate: (value) => {
        if (!validator.isURL(value)) {
          throw new Error("Image URL is not valid");
        }
      },
    },
    image: {
      type: String,
      validate: (value) => {
        if (!validator.isURL(value)) {
          throw new Error("Image URL is not valid");
        }
      },
    },
  },
  { timestamps: true }
);

// Update slug on name change
SubcategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Update the parent category with the subcategory reference
SubcategorySchema.pre("save", async function (next) {
  try {
    const category = await CategoryModel.findById(this.category);
    if (!category) {
      throw new Error("Category not found");
    } else {
      await category.updateOne({ $push: { subcategories: this._id } });
    }
    next();
  } catch (err) {
    next(err);
  }
});

const SubCategoryModel = mongoose.model("SubCategory", SubcategorySchema);

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      minLength: [4, "Product name must be more than 4 characters"],
      maxLength: [50, "Product name must not be more than 50 characters"],
    },
    slug: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minLength: [10, "Description must be more than 10 characters"],
      maxLength: [1000, "Description must not exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be at least 0"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be less than 0"],
      max: [100, "Discount cannot exceed 100"],
    },
    discountedPrice: {
      type: Number,
    },
    sizes: [
      {
        size: {
          type: String,
          required: true,
        },
        stock: {
          type: Number,
          required: true,
          min: [0, "Stock cannot be less than 0"],
        },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    images: [
      {
        type: String,
        validate: (value) => {
          if (!validator.isURL(value)) {
            throw new Error("Image URL is not valid");
          }
        },
      },
    ],
    attributes: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Update slug on name change and calculate discounted price
ProductSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  if (!this.discountedPrice || this.discountedPrice === 0) {
    this.discountedPrice = Math.floor(this.price - (this.price * this.discount) / 100);
  }
  next();
});

// Update the parent subcategory with the product reference
ProductSchema.pre("save", async function (next) {
  try {
    const subcategory = await mongoose.model("SubCategory").findById(this.subcategory);
    if (!subcategory) {
      throw new Error("Subcategory not found");
    } else {
      await subcategory.updateOne({ $push: { products: this._id } });
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Update the parent subcategory with the product reference
ProductSchema.pre("save", async function (next) {
  try {
    const subcategory = await SubCategoryModel.findById(this.subcategory);
    if (!subcategory) {
      throw new Error("Subcategory not found");
    } else {
      await subcategory.updateOne({ $push: { products: this._id } });
    }
    next();
  } catch (err) {
    next(err);
  }
});

const ProductModel = mongoose.model("Product", ProductSchema);

module.exports = { CategoryModel, SubCategoryModel, ProductModel };
