import  express  from "express";

const app= express();

app.get("/api/gate-way",async (req,res)=>{
    try{
        console.log("Upstream request received..!")
        const response = await fetch("http://localhost:4000/api/hello");
        console.log("Upstream response Status",response.status);
        const text= await response.json();
        console.log("Upstream Response",text);

        res.send(text);
    }
    catch(error){
        console.log(error);
        res.status(200).json(
            {
                message:"Upstream Service unavailable"
            }
        );
    }
});

app.listen(3000,()=>{
    console.log(`Api gatway is listening on port ${3000}`);
})
