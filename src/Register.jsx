import { useRef } from "react";

export default function Register({ onRegister }) {
  const input = useRef(null);

  function handlerClick() {
    if (input.current?.value) {
      onRegister(input.current.value);
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
