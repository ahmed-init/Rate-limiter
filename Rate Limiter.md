Rate Limiter



\*A single client can send 10 requests/sec

\*API gateway says is he/she can able to make another request ,if yes service if no error(too many request)

\*Redis stores that How many request a person made(It stores Ahmed made 7 requests)

\*Gateway checks redis (limit =10,current 7)

\*Gateway allows because 7<10

\*Error if ahmed made the 11th request







//

npm init -y

npm install express 

npm install -D typescript tsx @types/node @types/express



tsx(directly compiles the typescript instead of compiling to js)

@types/node(typescript get to know about node like process.env)

@types/express(typescript get to know about express (req,res))

npx tsc --init





//

request from the client reaches the gateway

gateway communicates with the upstream server

server returns the response



including redis we stores the client and their requests in the 

key value form (install a library so that node js can communicates with the redis)



not manually creating the redis just use docker-compose.yml file then run that file



docker ps(currently running containers)

docker ps -a(show all  including stopped ones)

docker stop <container-name>(stop a container)

docker start <container-name>(start)

docker rm <container-name>(to remove a container)



docker logs <container-name>(containers output)

docker exec -it rate-limit-redis redis-cli(to execute command inside the container)



docker compose up(docker reads the file and creates the required container)

docker compose down(image remains downloaded containers removed)

docker compose ps(running container)





//

now we have redis running inside the docker

now we need redis client to communicate with the node

so install redis





//

Node.js

&#x20;  │

&#x20;  │ redis://localhost:6379

&#x20;  ▼

Windows port 6379

&#x20;  │

&#x20;  │ Docker port mapping

&#x20;  ▼

Redis container port 6379

&#x20;  │

&#x20;  ▼

Redis server

//



for each client there will be a bucket and initialise the bucket with 5 tokens and refill rate will be 1token/sec







/Token Bucket--->>

When a request arrives:



1\. Check how much time has passed.



2\. Give the bucket the tokens it earned

&#x20;  during that time.



3\. Don't let the bucket exceed its maximum.



4\. Do I have at least one token?



&#x20;  YES:

&#x20;      Take one token.

&#x20;      Allow the request.



&#x20;  NO:

&#x20;      Reject the request.







//working node memory bucket 

we initialised bucket and its capacity and last refill time 

and executed the application it's working fine 

now if we are using two gatways we need to have a shared redis memory so we will get into it





now the redis will actually hold something like

**rate\_limit:client-1**



**tokens: 7**

**last\_refill: 1724490000000**

**\*the gateway asks redis what is the current state of this respective client**

**based on that api-gatway will allow or reject** 



**bucket=5tokens**

if we have two gateways the client sends the request to the gateways then single client may get 

multiple times of 5 tokens at each gateway



&#x20;               Redis

&#x20;                 │

&#x20;          ┌──────┴──────┐

&#x20;          │             │

&#x20;     Gateway 1      Gateway 2



for this we are using a shared redis database to store the bucket for each client

so if gateway 1 process the request the token becomes 4

then in the gateway 2 also it becomes 4





//assume a race condition

Now imagine two requests arrive together



This is where the difficult part begins.



Suppose Redis says:



tokens = 1



Then:



Gateway 1 → Request

Gateway 2 → Request



Both need that last token.



If we do this:



Gateway 1: "How many tokens?"

Redis: "1"



Gateway 2: "How many tokens?"

Redis: "1"



Both gateways might say:



"Great! I can use it."



Then both consume it.



Now we've allowed 2 requests when only 1 token existed.



That's the problem.



It's called a race condition.





//solution

How do we solve that?



We tell Redis:



"Don't let the gateways separately read and update the bucket. You do the entire operation yourself."



That's where Lua comes in.



Don't worry about Lua being a programming language. For now, think of it as:



A small program that we give to Redis to execute.



So instead of:



Gateway

&#x20;  ↓

GET

&#x20;  ↓

Gateway calculates

&#x20;  ↓

SET



we do:



Gateway

&#x20;  ↓

"Redis, run this bucket operation"

&#x20;  ↓

Redis

&#x20;  │

&#x20;  ├── Read tokens

&#x20;  ├── Calculate refill

&#x20;  ├── Check token

&#x20;  ├── Consume token

&#x20;  └── Save state

&#x20;  ↓

ALLOW / REJECT



Redis does all of that as one operation.





//redis will do the operations

READ

CALCULATE

UPDATE





//

gateway.ts -> imported connectRedis from redis.ts so it will execute the connectRedis function now our node will connect with the redis running inside the docker (6379)







//lua file



local key=KEYS\[1] (determines in which client's bucket im working with)

(HMGET,key,tokens,lastRefill) getting the state of a client

after modification it gives the updated state of the client

allowed =1 if permission given

allowed =0 id not

(HSET,key,tokens,lastRefill) setting the state of a client

