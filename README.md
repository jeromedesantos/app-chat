# Konsep Arsitektur

3.06.53

Struktur yang rapi biasanya seperti ini:

`Controller (HTTP)`
-> `Controller (Socket)`
-> `Service`
-> `Database`

Intinya:

- HTTP controller memanggil `registerUserService()`.
- Socket handler juga memanggil `registerUserService()`.
- Logic inti tetap satu tempat.

## Contoh Sederhana

### `register.service.js`

```js
export async function registerUser(data) {
  // validasi
  // hash password
  // simpan ke database
  return user;
}
```

### HTTP Controller

```js
app.post("/register", async (req, res) => {
  const user = await registerUser(req.body);
  res.json(user);
});
```

### Socket Handler

```js
socket.on("registerUser", async (data) => {
  const user = await registerUser(data);
  socket.emit("registerSuccess", user);
});
```

## Kesimpulan

Logic inti cukup satu, yang berbeda hanya cara memanggilnya (HTTP atau Socket).
