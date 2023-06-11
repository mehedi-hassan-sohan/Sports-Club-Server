const express = require('express');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe =require('stripe')(process.env.PAYMENT_SECRET_KEY)
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6ypoazf.mongodb.net/?retryWrites=true&w=majority`;

app.use(express.json());
app.use(cors());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Unauthorized access' });
  }

  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'Unauthorized access' });
    }
    req.decoded = decoded;
    next();
  });
};

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

    const ClassCollection = client.db('SportsClub').collection('ClassCollection');
    const studentCollection = client.db('SportsClub').collection('studentCollection');
    const instructorIDCollection = client.db('SportsClub').collection('instructorIDCollection');
    const instructorCollection = client.db('SportsClub').collection('instructorCollection');

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    });

    app.get('/students', async (req, res) => {
      const result = await studentCollection.find().toArray();
      res.send(result);
    });

    app.post('/students', async (req, res) => {
      const student = req.body;
      const query = { email: student.email };
      const existingUser = await studentCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'User already exists' });
      }

      const result = await studentCollection.insertOne(student);
      res.send(result);
    });

    app.patch('/students/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin',
        },
      };

      const result = await studentCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get('/students/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
        return;
      }

      const user = await studentCollection.findOne({ email: email });
      const result = { admin: user?.role === 'admin' };
      res.send(result);
    });

    app.patch('/students/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor',
        },
      };

      const result = await studentCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get('/students/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
        return;
      }

      const user = await studentCollection.findOne({ email: email });
      const result = { instructor: user?.role === 'instructor' };
      res.send(result);
    });


    app.get('/classes', async (req, res) => {
      const result = await ClassCollection.find().toArray();
      res.send(result);
    });

    app.post('/classes', async (req, res) => {
      const newItem = req.body;
      const result = await ClassCollection.insertOne(newItem);
      res.send(result);
    });

    app.get('/instructor', async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    });

    app.post('/instructor', async (req, res) => {
      const newInstructor = req.body;
      const result = await instructorCollection.insertOne(newInstructor);
      res.send(result);
    }); 



    app.post('/create-payment-intent',async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount:amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Sports server is running!');
});

app.listen(port, () => {
  console.log(`Sports server is running on port ${port}`);
});
