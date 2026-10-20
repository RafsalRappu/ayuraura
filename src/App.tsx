import { MotionConfig } from "framer-motion";

import AppRouter from "./routes/AppRouter";

function App() {
  // reducedMotion="user": every framer-motion animation honours the visitor's
  // OS "reduce motion" setting (transforms are skipped, opacity still fades).
  return (
    <MotionConfig reducedMotion="user">
      <AppRouter />
    </MotionConfig>
  );
}

export default App;
