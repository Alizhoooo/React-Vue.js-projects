import { useState } from 'react';

type UseAuthReturn = {
  username: string;
  setUsername: (name: string) => void;
};

let globalUsername = '';
let listeners: ((name: string) => void)[] = [];

export function useAuth(): UseAuthReturn {
  const [username, setUsernameState] = useState(globalUsername);

  const setUsername = (name: string) => {
    globalUsername = name;
    setUsernameState(name);
    listeners.forEach((cb) => cb(name));
  };

  // Sync state across hook instances
  if (!listeners.includes(setUsernameState)) {
    listeners.push(setUsernameState);
  }

  return { username, setUsername };
}