const express = require('express');
const cors = require('cors');
// -----------from mongodb-----------
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// ---------from dotenv(for hiding DB_ID and DB_PASS)-----------
require('dotenv').config();
// require('crypto').randomBytes(64).toString('hex') ---for getting random secrete code
const jwt = require('jsonwebtoken');
// ----------for running the server-------------
const app = express();
const port = process.env.PORT || 5000;

// ------------------middleware---------------
app.use(cors());
app.use(express.json());


// ----------mongodb start-----------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bphasys.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// -------------this part is for verify jwt -------------
const verifyJWT = (req,res,next) =>{
  console.log('hitting jwt')
  console.log(req.headers.authorization)
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:'unauthorized access'})
  }
const token = authorization.split(' ')[1];
console.log('jwt token split verify',token);
jwt.verify(token,process.env.ACCESS_TOKEN_SECRETE,(error,decoded)=>{
  if(error){
    return res.status(403).send({error:true,message:'unauthorized access'})
  }
  else{
    req.decoded = decoded;
    next();
  }
})
}
// ==========the part is closed=========



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

// ---declare this for getting the data and collection from database--
    const servicesCollection = client.db('carDoctor').collection('services');
    // ---------declare this for adding or posting a collection in database(similar to getting method)---------
    const bookingCollection = client.db('carDoctor').collection('bookings');

// -----------------Jwt(access token part)----------------
app.post('/jwt',(req,res)=>{
  const user = req.body;
  console.log(user);
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRETE,{expiresIn:'24h'});
  // -------here reason for giving second bracket to res.send is json isn't convert a string it only convert object so we make the token string to object--------
  res.send({token});
})
// --------access token part end-----------

// ---------find/load or getting all data from database ----------
app.get('/services',async(req,res)=>{
  const sort = req.query.sort;
  const search = req.query.search;
  console.log(search)
  // ======== this is for searching item by title =========== 
  const query = {title:{ $regex:search,$options:'i'}} 

  // ====== this is for filter or load item by price range ======
  const options = {
    // Sort matched documents in ascending order by price(filtering by price )
    sort: { "price": sort === 'ascending'? 1 : -1}}

    const result = await servicesCollection.find(query,options).toArray();
    res.send(result);
});


// ---------find/load or getting specific data from database---------
app.get('/services/:id',async(req,res)=>{
    const id = req.params.id;
    const query = {_id : new ObjectId(id)}
    const result = await servicesCollection.findOne(query);
    res.send(result)
});



// -----posting or adding data collection to database(booking) from client server-----
app.post('/bookings',async(req,res)=>{
    const booking = req.body;
    console.log(booking)
    const result = await bookingCollection.insertOne(booking);
    res.send(result);
});



// ----find/loading or getting sub-specific data from database (bookings)---(shortcut method)---
app.get('/bookings',verifyJWT,async(req,res)=>{
//   ----------part of verifyJWT---------------
 const decoded = req.decoded;
 console.log(decoded)
if(decoded.email !== req.query?.email){
  return res.status(403).send({error:1,message:'forbidden access'})
};
console.log('decoded',req.query?.email)
// -----------end of the part-----------
   let query = {};
  
   if(req.query?.email){
    query = {email:req.query.email}
   }
    const result = await bookingCollection.find(query).toArray();
    res.send(result);
});


// delete specific data from database collection (bookings)
app.delete('/bookings/:id',async(req,res)=>{
  const id = req.params.id;
  const query = {_id : new ObjectId(id)};
  const result = await bookingCollection.deleteOne(query)
  res.send(result);
});

// update specific data from database collection (bookings)
app.patch('/bookings/:id',async(req,res)=>{
  const id = req.params.id;
  const updatedBooking = req.body;
  const query = {_id : new ObjectId(id)}
  console.log(updatedBooking)
  const updateDoc = {
    $set: {
      status: updatedBooking.status
    },
  }
  const result = await bookingCollection.updateOne(query,updateDoc);
  res.send(result)
})


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// -----------mongodb end-----------





app.get('/',(req,res)=>{
    res.send('doctor is running')
});

app.listen(port,()=>{
    console.log(`doctor server is running on the port ${port}`)
})