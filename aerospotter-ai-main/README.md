# Visionary AI — Race Division

**Visionary AI** is a next-generation visual intelligence platform for high-stakes engineering. It has been fundamentally redesigned around a multi-persona **AI Race Engineering Crew**, transforming it from a simple analysis tool into an interactive, strategic command center. Built with a modern frontend stack, it leverages the full multi-modal power of the Google Gemini API to provide detailed, conversational analysis from a team of AI specialists, generate visual prototypes of new ideas, and deliver immersive audio debriefs.

## 🏆 Meet Your AI Race Engineering Crew

Forget a single co-pilot. You now have a team of dedicated AI specialists at your command:

-   **`Aero Sameel` (Lead Strategist)**: Your primary contact. Provides balanced summaries, delegates tasks, and gives decisive, high-level strategic direction. All initial reports and final decisions come from him.
-   **`Aero Shourya` (Aerodynamics Expert)**: Your visual and aerodynamics specialist. Handles all interpretation of physical changes, airflow analysis, and the generation of visual prototypes.
-   **`Aero Varun` (Data & Intelligence Analyst)**: The data-driven mind of the team. Deals with performance metrics, cost analysis, telemetry data, and competitive intelligence searches.

## ⚙️ Capabilities & How to Use Them

Engage your crew in a natural conversation. Here are the special commands and interactions you can use:

### General Conversation
-   **Ask follow-up questions:** "What is the likely trade-off for that new bargeboard?"
-   **Mention a specialist:** Direct your questions for targeted insights.
    -   *Example:* `Hey @Shourya, what are your thoughts on the airflow around this new element?`
    -   *Example:* `Can you run the numbers on that, @Varun?`

### `/prototype [your idea]`

Go beyond analysis and into creation. Ask Aero Shourya to visualize a new design concept.

- **Usage:** `/prototype [A detailed description of the visual change you want to see]`
- **Example:** `/prototype a more aggressive front wing with a steeper angle of attack and dual endplates`

### `/rival [team name]`

Generate a holographic "ghost" overlay of a competitor's design on your own car for direct comparison.

- **Usage:** `/rival [F1 Team Name]`
- **Example:** `/rival Red Bull`

### `@Varun intel [your query]`

Leverage Aero Varun's connection to real-world data. She will use Google Search to find the latest public information, articles, and analyses, presenting the findings with verifiable source links.

- **Usage:** `@Varun intel [Your question about trends, regulations, or competitors]`
- **Example:** `@Varun intel what are the latest technical regulations regarding floor designs?`

### `/simulate [track name]`

After running a "Delta Analysis" (comparing your upgrade vs. the AI's prophecy), you can run a full race simulation to see which strategy was superior. **This may trigger proactive alerts from the crew based on race events!**

- **Usage:** `/simulate [Famous Race Track Name]`
- **Example:** `/simulate Monaco`

### `/setup [track] [conditions]`

Ask for a data-driven starting setup for a specific race track.

- **Usage:** `/setup [Track Name] [Optional: weather conditions]`
- **Example:** `/setup Silverstone wet conditions`

### `/analyze_audio [description]`

Provide a description of a rival car's sound from on-board or trackside footage, and get an intelligence analysis of what it might mean.

- **Usage:** `/analyze_audio [Description of the sound]`
- **Example:** `/analyze_audio a high-pitched whine on upshift followed by a stuttering sound on overrun`

### `/cost_benefit [change-id]`

Request a detailed cost-benefit analysis for a specific change identified in the initial report.

- **Usage:** `/cost_benefit [change-id from the briefing panel]`
- **Example:** `/cost_benefit change-1`

## ✨ Core Features

- **Multi-Domain Analysis**: Switch the engine's context between F1 Engineering, Manufacturing, Infrastructure, and a new **Quality Assurance** mode. In QA mode, the AI compares a manufactured part against a "digital twin" to find microscopic production flaws.
- **Proactive Strategy Agent**: During simulations, the AI crew can autonomously identify strategic opportunities (like a safety car) and issue time-sensitive commands, demonstrating true proactive intelligence.
- **AI Internal Debate & Red Flag System**: To ensure accuracy, the AI crew is programmed to **internally debate and cross-question** each other's findings. Any unresolved concerns are highlighted as **"Red Flags."**
- **Immersive Audio Debriefs**: Receive an initial analysis summary as a **voice debrief** from Aero Sameel, complete with a live, karaoke-style transcript.
- **Live Camera Analysis**: Switch from file uploading to a live webcam feed to analyze real-world objects instantly.
- **Quantitative Impact Reporting**: Each change includes an **estimated cost** and a **quantified performance gain**.
- **Comprehensive Reports**: Export analysis results into detailed PDF reports, annotated PNG images, or raw JSON data.

## Tech Stack

- **Frontend**: React, TypeScript
- **Styling**: Tailwind CSS (via CDN), Framer Motion
- **AI Models**: Gemini 2.5 Flash Lite (Chat), Gemini 2.5 Flash (Analysis), Gemini 2.5 Flash Image, Gemini 2.5 Flash TTS
- **PDF Generation**: jsPDF, jspdf-autotable

## Local Development

Follow these instructions to get the project running on your local machine.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or a compatible package manager
- A Google Gemini API key

### Installation & Setup

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/visionary-ai.git
    cd visionary-ai
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Create a new file named `.env` in the root of the project.

    Open the `.env` file and add your Google Gemini API key:

    ```env
    API_KEY="your_gemini_api_key_here"
    ```

    You can obtain a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

4. **Run the development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

This application can be easily deployed to modern hosting platforms like Vercel or Netlify.

### Deploying to Vercel

1. **Push to GitHub:** Ensure your project is on a GitHub repository.

2. **Import to Vercel:** Log in to your Vercel account, select "Add New... > Project", and import your GitHub repository. Vercel will likely detect the correct framework settings automatically.

3. **Configure Environment Variables (MANDATORY STEP):**

   **This is the most critical step for your deployed application to function.** The application requires the `API_KEY` to be available in its environment. In your Vercel project's dashboard, go to **Settings > Environment Variables**.

   - Add a new variable.
   - The **Name** (or Key) must be exactly `API_KEY`.
   - The **Value** should be your secret Gemini API key.
   - Ensure the variable is available for all environments (Production, Preview, Development).

   Vercel will securely provide this variable to your application during the build process and at runtime.

4. **Deploy:** Trigger a deployment. Once complete, your live URL will work exactly like your local preview, with all AI features fully functional.

---

*This project was created to demonstrate a visionary approach to multi-modal AI interaction in complex engineering domains.*
