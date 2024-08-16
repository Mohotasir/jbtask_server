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
    await client.connect();

    const productCollection = client.db("Products").collection("allProducts");

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
            const { priceOrder, isLatestFirst } = req.query;
    
            const sortQuery = {};
            
            // Set the sort query based on user selection
            if (priceOrder === 'High to Low Price') {
                sortQuery.price = -1;  // Sort by price descending
            } else if (priceOrder === 'Low to High Price') {
                sortQuery.price = 1;   // Sort by price ascending
            }
    
            if (isLatestFirst === 'true') {
                sortQuery.
                creationDateTime = -1;  // Sort by creation date descending
            }
    
            const products = await productCollection.find().sort(sortQuery).toArray();
            res.json(products);
        } catch (error) {
            console.error('Error sorting products:', error);
            res.status(500).json({ error: 'Error sorting products' });
        }
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
