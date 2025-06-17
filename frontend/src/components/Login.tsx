import React, { useState } from 'react'

interface LoginProps {
  handleLogin: (username, password) => void
}

const Login: React.FC<LoginProps> = ({ handleLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setpassword] = useState('')
  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30'>
        <div className="rounded-lg p-6 shadow-lg bg-base-100">
          <h2 className='text-xl text-primary font-bold mb-4'>Login</h2>
            <input type="text" placeholder='username' onChange={(e) => {setUsername(e.target.value)}} className='input input-bordered w-full mb-2'/>
            <input type="password" placeholder='password' onChange={(e) => {setpassword(e.target.value)}} className='input input-bordered w-full mb-4'/>
            <button onClick={() => handleLogin(username, password)} className='btn btn-primary w-full' >Login</button>
        </div>
    </div>
  )
}

export default Login