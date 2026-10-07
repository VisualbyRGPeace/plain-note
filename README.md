# Plain Note

> Just text. Nothing else.  
> WRITE → SAVE → FIND

Web app ghi chú tối giản, chạy hoàn toàn trên trình duyệt (React + Vite, không backend). Hỗ trợ PWA (Add to Home Screen, offline).

## Cài đặt & chạy local
```bash
npm install
npm run dev        # http://localhost:5173
```

## Build
```bash
npm run build      # output: dist/
npm run preview    # xem thử bản build
```

## Deploy lên GitHub Pages
1. Tạo repo trên GitHub, rồi push code lên nhánh `main`:
   ```bash
   git init && git add . && git commit -m "Plain Note"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
2. Vào **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Mỗi lần push vào `main`, workflow `.github/workflows/deploy.yml` tự chạy `npm ci` → `npm run build` → deploy `dist/`.
4. Web chạy tại `https://<user>.github.io/<repo>/`.

`vite.config.js` dùng `base: './'` nên không cần sửa khi đổi tên repo.

## Phím tắt
`Ctrl/Cmd+K` tìm kiếm · `N` note mới (ở Home) · `Ctrl/Cmd+Enter` xong · `Esc` quay lại

## Dữ liệu & bảo mật
- Notes lưu trong `localStorage` (key `plain_notes`) của chính trình duyệt này. Không gửi lên server, không analytics.
- **localStorage KHÔNG mã hóa.** Ai dùng chung máy/profile, extension độc hại, hoặc lỗi XSS đều có thể đọc được. Không nên lưu mật khẩu quan trọng.
- Cờ "Private" hiện chỉ là nhãn. Muốn mã hóa thật, thêm vào `serialize/deserialize` trong `src/utils/storage.js` (ví dụ Web Crypto AES-GCM + passphrase).
- Xóa dữ liệu trình duyệt sẽ mất notes: hãy dùng **Settings → Export notes** để sao lưu định kỳ.

## Đồng bộ nhiều thiết bị (tùy chọn, mã hóa đầu-cuối)
Dùng Firebase (gói Spark miễn phí): Authentication + Firestore. Server chỉ lưu bản mã AES-256-GCM; khóa sinh từ "encryption passphrase" (PBKDF2, 600k vòng) chỉ nằm trong bộ nhớ thiết bị.
1. console.firebase.google.com → **Add project** (có thể tắt Analytics).
2. **Authentication → Get started → Sign-in method → Email/Password → Enable**.
3. **Firestore Database → Create database** (chọn region gần, ví dụ asia-southeast1) → tab **Rules** → dán nội dung `firestore.rules` → **Publish**.
4. **Project settings → Your apps → Web (</>)** → đăng ký app → copy `firebaseConfig` vào `src/config.js`.
5. **Authentication → Settings → Authorized domains** → thêm `<user>.github.io`.
6. Commit, đợi deploy. Mở app → **Settings → Sync**: tạo tài khoản, tạo passphrase. Trên điện thoại đăng nhập cùng tài khoản + passphrase.

Lưu ý: quên passphrase = không khôi phục được note trên cloud. Bản trên máy vẫn lưu dạng thường trong localStorage; Sign out sẽ xóa notes khỏi thiết bị.
