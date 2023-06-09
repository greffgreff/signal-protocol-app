import { useRef } from "react";
import { v4 as uuid } from "uuid";

export default function Register({ onRegister }) {
  const input = useRef(null);

  function handlerClick() {
    if (input.current?.value) {
      onRegister({
        id: uuid(),
        username: input.current.value,
      });
    } else {
      alert("Input is empty!");
    }
  }

  return (
    <div className="register-wrapper">
      <h1>Register</h1>
      <input type="text" placeholder="Enter a username" ref={input} />
      <input type="button" value="Register" onClick={handlerClick} />
    </div>
  );
}
