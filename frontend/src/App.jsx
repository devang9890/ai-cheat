import WebcamFeed from "./components/proctoring/WebcamFeed";

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">
        AI Exam Proctoring – Face Detection
      </h1>

      <WebcamFeed />
    </div>
  );
}

export default App;
