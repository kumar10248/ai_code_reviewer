const BASE_URL = "http://localhost:8000/api/v1"

export const registerUser = async (form: {
  name: string
  email: string
  password: string
}) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(form)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.msg || "Register failed")
  }

  return data
}

export const loginUser = async (form: {
  email: string
  password: string
}) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(form)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.msg || "Login failed")
  }

  return data
}