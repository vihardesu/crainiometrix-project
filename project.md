Context
We are building an MVP for a take-home project for a company called Crainiometrix. They are a non-clinical care navigator for dementia patients and their families. They hire care navigators (humans) and give them a platform to interact with dementia patients and their families. 

The MVP
Prove that you can build a 24/7 in-bound messages triage-and-escalate agent for a care navigator. A care navigator might be have a patient panel of 100 patients, each with 4 or more relatives/care takers that can reach out to the navigator at any given time. As a result, that's a LOT of people to attend to and respond to 24/7. We want a way to streamline the process so that navigators are not flooded with messages. They should be able to toggle an AI-Mode on/off button that (when toggled on) looks through unread messages and run an agentic workflow that decides whether to auto-respond, escalate, or keep as unread (effectively inconcluse and needs normal review).

The  Timeline
3 hours to build. As a result, we need to make a practically scoped mvp. We need to cut complexity. We can do so by hardcoding things like users/auth and not implementing non-core UI. The most important feature is the correct simulation of the agent-mode toggling on/off and starting its work.

The Tech
To keep things efficient, i want to use a stack im comfortable with.
- github for the code
- vercel for deploying (its already attached)
- nextjs/react for both the frontend and its in-built backend api.
- supabase for the db. we will create a new personal project in my account thats already attached. mastra for ai agent code. all api work should be co-located to the api folder's code.
- untitled-ui/tailwind for frontend ux. 
- react tan stack query library for hooks/api calls management if relevant on the frontend
- ai vercel sdk (for frontend client), vercel's ai backend sdk (for our api)
- llm api keys for claude models (i will provide them)

User Flow 1
- the core login/logout flow for the care navigator
- once logged in, navigator should see a messages sidebar item that opens to a messages page.
- messages page is a standard messages command center. sidebar on the left with conversations sorted by unread (top) chronological order downwards
- when a navigator clicks a thread they should see the conversation on the right-hand side and have a place to type messages and respond on the bottom
- AI MODE -- there should be a toggle on the top of the messages ux that allows the user to turn it on/off [it can be a play/pause button with blinking on indicators]
- when AI MODE is off, all responses are manual. this is the traditional style of responding to messages
- when AI MODE is on, we can see a slight blurring of the messages window so the user can no longer click it. then, we see the agent picking off one unread message at a time and responding or escalating if relevant. we can do this by refreshing/polling to look for changes.

User Flow 2
- once logged in, there is also an admin sidebar item
- when a user clicks on the admin sidebar item, there is a simple messaging client that allows you to send a message on behalf of any patient/caregiver in the database. there is no persisted conversations sidebar here. it is just a selector for a user and when clicked it pulls of their conversation with the navigator and we can send messages as the user. this is to demonstrate that we can send messages to our navigator and show how it responds.

Shortcuts
- Let's hard code login/logout. we can seed the db with a few sample login prifiles to speed up logging in/logging out
- Let's keep the messages implementation really lightweight. use your judgement here

The Core Agent
An agent is modeled as an agentic workflow (see mastra for details). It kicks off with an input of conversation id, user id, etc. to give it all the relevant context for responding to the message. the agent then runs as follows (some steps run in parallel):
1a. quick agentic classification on the message to put it into one of a few categories: Scheduling, Clinical, Referral, Non-Clinical, Transportation. (api call to llm)
1b. quick agentic classification on the message to determine if its Urgent or Non-Urgent (api call to llm)
1c. quick context fetch to get some info on who the person is (basic info (api call fetch to our backend)
1. once the three steps above are done, agent (api call to llm) decides if it can respond by labeling response status as -- AI, Human, Escalate, Indeterminate -- with summary explanations
3a. if ai response status is "AI", the (api call to a sub-agent), then our core agent submits a response in the conversation thread
    Subagent -- fetches info dynamically with its available tools to find info to respond -> then it drafts a response
3b. if ai response status is "Human", this means that human must answer this, we do nothing
3c. if ai response is "Escalate", we mark the message as urgent. ideally, the conversation becomes visibly red in the conversations thread to indicate that the user needs to respond.
3d. if ai response is "Indetermine", then we need to explain why nothing was done.

Important: HOW THE UX CHANGES DURING/AFTER AI MODE
1. when ai mode is on, the user should not be able to intervene and start messaging patients. this may lead to race conditions.
2. when ai mode is off or has finished working, there should be a little indicator on the bottom of any message an AI has tried to act on (note: just the message that it was told to respond to) that a care navigator can click to open up a right sidecar that provides a summary of what the agent did (how it classified, what its ultimate decision was, etc.)
3. if an ai responds/responded historically on behalf of a navigator, there should be an explicit indicator that an AI responded (either in the form of a different color and/or a user profile next to it that clearly says it was an agent not a human)

 