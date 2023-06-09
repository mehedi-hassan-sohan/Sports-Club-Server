const express = require('express')
const app = express()
require('dotenv').config()

const cors = require('cors')
const port = process.env.PROT || 5000 

//middleware
app.use(express.json()); 
app.use(cors())
 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6ypoazf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect(); 

    const ClassCollection = client.db("SportsClub").collection("ClassCollection");
    const studentCollection = client.db("SportsClub").collection("studentCollection");
    const instructorCollection = client.db("SportsClub").collection("instructorCollection");  
   
    app.get('/students',  async (req, res) => {
      const result = await studentCollection.find().toArray();
      res.send(result);
    });
  
    app.post('/students', async (req, res) => {
      const student = req.body;
      const query = { email: student.email }
      const existingUser = await studentCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await studentCollection.insertOne(student);
      res.send(result);
    });
    
    app.patch('/students/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
    
      // Rest of your code
      const result = await studentCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    
    

    app.get('/classes', async (req, res) => {
        const result = await ClassCollection.find().toArray();
        res.send(result);
      }); 
      app.post('/classes',  async (req, res) => {
        const newItem = req.body;
        const result = await  ClassCollection.insertOne(newItem)
        res.send(result);
      })  



      app.get('/instructor', async (req, res) => {
        const result = await instructorCollection.find().toArray();
        res.send(result);
      });  

      app.post('/instructor',  async (req, res) => {
        const newInstructor = req.body;
        const result = await  instructorCollection.insertOne(newInstructor)
        res.send(result);
      }) 
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Sports server is Running!')
}) 

app.listen(port, () => {
  console.log(`Sports server is Running ${port}`)
}) 

