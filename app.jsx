import React from 'react';

const App = () => {
  if (new Date().getHours() < 12) {
    return <h1>Good Morning!</h1>;
  } else {
    return <h1>Good Evening!</h1>;
  }
};

export default App;
