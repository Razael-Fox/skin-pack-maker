---
name: react-hooks-state-sync
description: Panduan untuk menghindari error react-hooks/set-state-in-effect saat sinkronisasi prop ke state lokal
---

# Sinkronisasi Prop ke State Lokal di React

Saat Anda perlu membuat *derived state* (mengambil nilai dari *props* untuk dijadikan *initial state* lokal, dan meresetnya ketika *props* berubah), **JANGAN MENGGUNAKAN `useEffect`** untuk melakukan sinkronisasi dengan `setState`. Hal tersebut menyebabkan *cascading renders* (render beruntun) yang tidak efisien dan akan memicu error linting: `react-hooks/set-state-in-effect`.

## ❌ Pola Kode yang Salah (Antipattern)
```tsx
const [localValue, setLocalValue] = useState(props.value)

// Ini akan memicu error linting dan render tambahan yang tidak perlu
useEffect(() => {
  setLocalValue(props.value)
}, [props.value])
```

## ✅ Pola Kode yang Benar (Merender Ulang Berdasarkan Key)
Jika *state* sepenuhnya di-*reset* saat *prop* (seperti `id`) berubah, cukup operkan `key={id}` saat memanggil komponen tersebut. React akan otomatis meng-unmount dan me-remount komponen.

## ✅ Pola Kode yang Benar (Menyimpan Nilai Sebelumnya di State)
Sesuai dokumentasi React ("You might not need an effect"), lakukan pengecekan langsung di fase render:
```tsx
const [prevValue, setPrevValue] = useState(props.value)
const [localValue, setLocalValue] = useState(props.value)

if (props.value !== prevValue) {
  setPrevValue(props.value)
  setLocalValue(props.value) // Akan me-render ulang tanpa mount tambahan di DOM
}
```

## Referensi Tambahan
- React Docs: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
