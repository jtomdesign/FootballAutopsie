const users = [
  {
    id: "1",
    name: "Admin",
    email: "admin@test.com",
    password: "123456",
    role: "admin",
  },
  {
    id: "2",
    name: "Joel",
    email: "joel@test.com",
    password: "123456",
    role: "user",
  },
];

export async function fakeLogin({ email, password }) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const user = users.find(
    user => user.email === email && user.password === password,
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  return user;
}
