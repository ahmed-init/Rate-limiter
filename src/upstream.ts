import express from "express";

const app=express();

app.get("/api/hello",(req,res)=>{
    res.status(200).json({
        message:"Hello from upstream service"
    });
})

app.listen(4000,()=>{
    console.log(`Server is listening on port ${4000}`);
})