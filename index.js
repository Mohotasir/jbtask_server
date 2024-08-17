const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ey9o5hx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    //await client.connect();

    const productCollection = client.db("Products").collection("allProducts");
    const userCollection = client.db("Products").collection("users");


    app.get("/allProducts", async (req, res) => {
      try {
        const result = await productCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: "Error fetching all products" });
      }
    });

    app.get("/search", async (req, res) => {
      try {
        const name = req.query.name;
        if (!name) {
          return res.status(400).json({ error: "Search term is required" });
        }
        const query = { name: { $regex: new RegExp(`^${name}`, "i") } };
        const searchResults = await productCollection.find(query).toArray();
        res.json(searchResults);
      } catch (error) {
        console.error("Error searching products by tag:", error);
        res.status(500).json({ error: "Error searching products by tag" });
      }
    });

    app.get("/filtered", async (req, res) => {
      try {
        const { minPrice, maxPrice } = req.query;
        const query = {
          price: { $gte: Number(minPrice), $lte: Number(maxPrice) },
        };
        const products = await productCollection.find(query).toArray();
        res.json(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Error fetching products" });
      }
    });

    app.get('/sortProducts', async (req, res) => {
        try {
          const { priceOrder, isLatestFirst, brand, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
      
          const query = {};
      
          // Filter by brand
          if (brand) {
            query.brand = brand;
          }
      
          // Filter by category
          if (category) {
            query.category = category;
          }
      
          // Filter by price range
          if (minPrice && maxPrice) {
            query.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
          }
      
          const sortQuery = {};
          if (priceOrder === 'High to Low Price') {
            sortQuery.price = -1;
          } else if (priceOrder === 'Low to High Price') {
            sortQuery.price = 1;
          }
      
          if (isLatestFirst === 'true') {
            sortQuery.creationDateTime = -1;
          }
      
          const skip = (page - 1) * limit;
          const products = await productCollection.find(query).sort(sortQuery).skip(Number(skip)).limit(Number(limit)).toArray();
      
          const totalProducts = await productCollection.countDocuments(query);
          const totalPages = Math.ceil(totalProducts / limit);
      
          res.json({ products, totalPages });
        } catch (error) {
          console.error('Error sorting products:', error);
          res.status(500).json({ error: 'Error sorting products' });
        }
      });
      
      
    app.post("/users", async (req, res) => {
        const user = req.body;
        const query = { email: user.email };
        const existUser = await userCollection.findOne(query);
        if (existUser) {
          return res.send({ message: "user already  exist", insertedId: null });
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
      });

    app.get("/", (req, res) => {
      res.send("server is running!");
    });

    app.listen(port, () => {
      console.log(`App running on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
}

run().catch(console.dir);
