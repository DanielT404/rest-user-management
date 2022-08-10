## Few mentions before diving in:

1. I'm by no means a pure architect at heart; I have been involved in architectural decisions being part of the team, but I'm more inclined towards actively developing on an already established architecture and being a key team player.
2. For the given backend project, **I have made the assumption that the microservices will be built by teams that are within the same organization or company**.
3. I have done my own research and this is a result solely of my own understanding of the concepts and past experiences; one must adapt in any context, conquer the challenges facing them and come up with a solution.

## My take on designing a monorepository, with multiple microservices architecture for a new application in the initial SDLC phase for the backend team(s) developer(s).

Having **multiple microservices available in a monorepository unit architecture**, has its own pros' and cons'.
There is also the approach to have **independent microservices available in multiple repositories architecture**, which has its own pros' and cons' aswell.

An architectural decision is made out of a pool of available options, where each option has its strengths and weaknesses.
Any architectural decision you make will have a trade-off at the end of the day in relation to the other option(s) you could have chosen; you must assess and decide if the trade-off will be worth it or not for the ones who will be heavily relying on your initial architecture moving forward: the developers.
I view the architectural design as a highly subjective topic to the initial architect own principles and thought process.

There's no _right_ or _wrong_ way really; nothing is perfect.

## I have chosen to go the monorepository route mainly for the following reasons, where the multirepos tends to fall apart:

1. Works well with teams that are within the same organization or company.
2. You have a great, clear picture of all the microservices that the end client(s) will use.
3. Quickly assess the microservices that are currently used by the client(s) and discard microservices that are no longer used by the end client(s) from the repository, helping the company to reduce the overall costs of running infrastructure.
4. Easier tracking progress of the microservices active development (e.g. identifying bottlenecks at the services level that may slow down the entire development process).
5. Continuous Integration and Continuous Deployment for the entire backends' microservices are easier to implement since the codebase of every single microservice is available inside one place, one repository.
6. Scalability will not be affected, as each service will have its own isolated core logic inside the mono repository.
7. Enables developers to communicate more efficiently; there is a sense of unit belonging in the same repository, where each is contributing towards achieving the end goals in small, incremental steps. When there's work to be seen, there's work to be done.
8. There's a single point of truth; every microservice functionalities have clear author(s) ownership, allowing developers to quickly reach out to the team maintaining a specific service to ask for additional support.

## Disadvantages of using the monorepository approach

1. Additional GitHub / GitLab settings complexity overheads on the monorepository level to implement RBAC to mitigate security risks.
2. If external teams will join at a later time, they will be limited to interact with the git repository platform that has been initially used (usually GitHub or GitLab); some teams may prefer using GitLab, while others GitHub.
3. It would break in shambles if multiple organizations, each with their own internal teams, will be collaborating for the same project; the overall complexity added to the monorepo structure, RBAC settings, etc. would simply not make it a viable option anymore.
4. Rigid, unflexible architecture.
5. Longer onboarding process for new employees.
6. It can grow in volumes of data and number of commits during the entirety of SDLC pretty fast. For most projects, I don't personally think it would grow as large as to the point of causing interruptions or delays in the development process if you follow some basic guidelines.
   Big volume data that could spike the overall time to clone the git project are usually microservice-related dependencies (looking at you, `node_modules`); as long as you don't forget to include such potentially-becoming-large files in the `.gitignore`, you are most likely in the clear.
   The number of commits could be diminished by using some git strategies such as: `rebase` and `squash`.

## Final Conclusions

So... the question still remains: **which approach of the two would suit the best for building a microservice-oriented architecture?** The answer is _it depends_ for each project particularities.
And as I have mentioned earlier, there's no _right_ or _wrong_ way.
It's just a matter of what you're willing to trade off.

### Example 1

If the Project Manager and Tech Lead are certain that the project requirements won't be fully achievable by the teams available within the organization, you would need to ask for help from external sources.
Asking for help from external sources would require to give them flexibility in implementation.
Flexibility definitely isn't one of the strengths of the monorepository approach.
Go for the independent microservices available in multiple repository approach.

### Example 2

If the backend is built of several microservices that communicate with other microservices and all of them must operate in order to ensure the availability to the end client, you would want to have some end-to-end testing.
Take, for example, two microservices that could be present in the form of exposed HTTP endpoints to an ecommerce website:

1. `OrderService`, dealing with order-related functionalities
2. `PaymentService`, dealing with payment-related functionalities.
   There has to be some sort of coupling between `OrderService` and `PaymentService` in order to assess whether the orders having as payment method credit card have been paid or not.
   You run some unit testing on each individual service and they work as intended.
   You deploy to production and the `OrderService` is not taking into account some information coming from `PaymentService`, for example whether the third-party payment gateway has authorized the payment to be made or not.
   `OrderService` is called through the exposed HTTP endpoint and sends the order information to `PaymentService`, selects as payment method credit card... and `PaymentService` is faulty and responds back to the `OrderService` that the order has been paid succesfully.
   End-to-end testing ensures that the end client consuming the HTTP endpoint will get the intended result back after all the microservices have been called.
   End-to-End testing wouldn't really make sense in the context of a multiple repository approach.
   Why?

   - End-to-End testing must go to the entire flow an end client (user in this case) would have from start to finish.
   - This implies that you must orchestrate the `PaymentService` and `OrderService` to start together.
   - That ain't too hard, but what if `OrderService` is coupled to other services, such as `AccountService` (for some reason, let's assume the business logic requires an account in order to make a order, albeit that doesn't make too much sense nowadays)?
   - Now you have three microservices that you must take care of. And each microservice lives in a separate repository.
   - What if there are multiple related microservices?
     You get the point. The closer the services are, the easier it is to spin up end-to-end tests. You have one single place to grab all the services needed to get the job done, as opposed to 10 scattered multi-repositories.

If your microservices don't rely on other microservices and some individual unit tests are enough to ensure they are working as intended, go for the independent microservices available in multiple repository approach.
Otherwise go for the monorepository with multiple microservices architecture.

Signed by,  
Daniel Țună
