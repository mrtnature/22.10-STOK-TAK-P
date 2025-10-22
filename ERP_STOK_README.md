# ERP-STOK - Offline-First Stok & Üretim Yönetim Sistemi

## 📱 Genel Bakış

ERP-STOK, Android cihazlar için geliştirilmiş, tamamen offline çalışan bir stok ve üretim süreçleri yönetim uygulamasıdır. Hareketli Ağırlıklı Ortalama (Weighted Average) maliyet hesaplama yöntemi ile envanter yönetimi sağlar.

### ✨ Temel Özellikler

- **📦 Stok Takip**: Ürün ekleme, düzenleme, silme; otomatik maliyet hesaplama
- **⚙️ Üretim Süreçleri**: Şablon bazlı üretim, stok tüketimi, müşteri yönetimi
- **💰 Satış & Kârlılık**: Sipariş takibi, durum akışı, kârlılık analizi
- **👥 Müşteri Bilgileri**: Müşteri veritabanı yönetimi
- **🔔 Bildirimler**: Kritik stok uyarıları
- **💾 Yedekleme**: JSON export/import, WhatsApp/email paylaşımı

## 🏗️ Mimari

### Teknoloji Yığını
- **Framework**: Expo (React Native)
- **Database**: SQLite (Offline-first)
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **State Management**: React Context API
- **UI Theme**: Corporate Navy Blue (#1E3A8A) with 3D shadows

### Veritabanı Şeması

```sql
-- Stok Kalemleri
stock_items (id, name, sku, unit, critical_qty, on_hand_qty, avg_cost, created_at, updated_at)

-- Stok Hareketleri
stock_moves (id, item_id, move_type, qty, unit_price, supplier, move_date, note, created_at)

-- Üretim Şablonları
templates (id, name, created_at, updated_at)
template_items (id, template_id, item_id, qty)

-- Müşteriler
customers (id, name, email, phone, address, created_at, updated_at)

-- Siparişler
orders (id, customer_id, template_id, status, sale_price, shipper, tracking_code, created_at, updated_at)

-- Bildirimler
notifications (id, type, title, message, created_at, read_at)
```

## 💡 İş Mantığı

### Hareketli Ağırlıklı Ortalama (Weighted Average Costing)

**Stok Girişi (IN):**
```
new_avg_cost = (current_qty × current_avg + new_qty × new_price) / (current_qty + new_qty)
new_on_hand = current_qty + new_qty
```

**Stok Çıkışı (OUT):**
```
cost = current_avg_cost
new_on_hand = current_qty - out_qty
```

**Kritik Stok Kontrolü:**
- Her stok çıkışında kritik seviye kontrolü
- `on_hand_qty < critical_qty` ise otomatik bildirim

### Üretim Akışı

1. **Şablon Seçimi**: Kullanıcı bir üretim şablonu seçer
2. **Stok Kontrolü**: Yeterli malzeme var mı?
3. **Müşteri Bilgileri**: Ad, telefon, email, adres, satış fiyatı
4. **Üretim**: 
   - Şablondaki her kalem için `recordStockOut()` çağrılır
   - Sipariş kaydı oluşturulur (status: 'ordered')
   - Kritik stok bildirimleri tetiklenir

### Satış Durum Akışı

```
Sipariş Alındı → Üretime Alındı → Kargoya Verildi → Tamamlandı
```

- Her adımda onay iletişim kutusu
- Kargoya verildi adımında: Kargo şirketi + takip kodu
- Her durum değişiminde email paylaşım seçeneği (native share sheet)

## 📂 Proje Yapısı

```
frontend/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Ana ekran (4 kart + bildirim zili)
│   │   ├── index.web.tsx      # Web fallback
│   │   └── settings.tsx       # Ayarlar (yedekleme)
│   ├── stock/
│   │   └── index.tsx          # Stok listesi
│   ├── production/
│   │   └── index.tsx          # Üretim şablonları
│   ├── sales/
│   │   └── index.tsx          # Satış takip
│   ├── customers/
│   │   └── index.tsx          # Müşteri listesi
│   └── _layout.tsx            # Root layout
├── components/
│   ├── StockForm.tsx          # Stok ekleme/düzenleme formu
│   ├── TemplateForm.tsx       # Şablon formu
│   ├── ProductionFlow.tsx     # Üretim akış formu
│   └── CustomerForm.tsx       # Müşteri formu
├── contexts/
│   └── AppContext.tsx         # Global state
├── constants/
│   └── theme.ts               # Tema tanımları
└── lib/
    └── database.ts            # SQLite operations
```

## 🎨 UI/UX Özellikleri

### Tema
- **Primary**: #1E3A8A (Navy Blue)
- **Accent**: #10B981 (Emerald)
- **Kontrast**: Minimum 4.5:1 (WCAG AA)
- **Kartlar**: 3D gölge efekti (SAP benzeri)

### Form Validasyonu
- Zorunlu alanlar yıldız (*) ile işaretli
- Inline hata mesajları
- Input placeholder'lar Türkçe

### Erişilebilirlik
- Yüksek kontrast metin
- Touch target minimum 44px
- Keyboard-aware scroll view

## 📱 Kullanım

### 1. Stok Ekleme
1. Ana ekran → "Stok Takip" kartına tıkla
2. Sağ üstteki "+" butonuna bas
3. Formu doldur:
   - Ürün Adı* (zorunlu)
   - SKU (opsiyonel)
   - Miktar* + Birim*
   - Birim Fiyat (₺)*
   - Kritik Stok Seviyesi
   - Tedarikçi (free-text)
   - Tarih*
4. "Kaydet"

### 2. Üretim Şablonu Oluşturma
1. Ana ekran → "Üretim Süreçleri"
2. "+" → Şablon adı gir
3. Ürün ekle:
   - Dropdown'dan ürün seç
   - Miktar gir
   - "+" butonu ile ekle
4. Toplam maliyet otomatik hesaplanır
5. "Oluştur"

### 3. Üretim Yapma
1. Üretim Süreçleri → Şablon seç → "Üret"
2. Kullanılacak malzemeler listesi gösterilir
3. Müşteri bilgilerini doldur:
   - Ad Soyad*
   - Telefon, Email, Adres
   - Satış Fiyatı (₺)*
4. "Üretimi Tamamla ve Sipariş Oluştur"
5. Stok otomatik düşer, sipariş oluşturulur

### 4. Sipariş Takibi
1. Ana ekran → "Satış & Kârlılık"
2. Sipariş kartında durum butonu:
   - "Üretime Alındı Olarak İşaretle"
   - "Kargoya Verildi..." (kargo bilgileri sor)
   - "Tamamlandı Olarak İşaretle"
3. Her adımda email paylaşım seçeneği (native mail app)

### 5. Yedekleme
1. Ayarlar sekmesi
2. "Yedek Al" → JSON dosya oluştur
3. "Yedeği Paylaş" → WhatsApp/Email ile paylaş
4. "Yedek Yükle" → JSON dosya seç → Merge edilir

## 🧪 Test Senaryoları

### WAvg Hesaplama Testi
```
# Başlangıç
Item: Pamuk Kumaş, On Hand: 0, Avg Cost: 0

# 1. Giriş
IN: 100 metre @ ₺10/metre
Expected: On Hand = 100, Avg Cost = ₺10

# 2. Giriş
IN: 50 metre @ ₺12/metre
Expected: On Hand = 150, Avg Cost = ₺10.67
Calculation: (100*10 + 50*12) / 150 = 1600 / 150 = 10.67

# 3. Çıkış
OUT: 80 metre
Expected: On Hand = 70, Avg Cost = ₺10.67 (değişmez)

# 4. Giriş
IN: 30 metre @ ₺15/metre
Expected: On Hand = 100, Avg Cost = ₺11.97
Calculation: (70*10.67 + 30*15) / 100 = 1196.9 / 100 = 11.97
```

### Kritik Stok Bildirimi
```
# Setup
Item: Düğme, Critical Qty: 100, On Hand: 120

# Senaryo
Production Template: T-Shirt (kullanır 25 düğme)
Üretim 1: On Hand = 95 → Bildirim YOK
Üretim 2: On Hand = 70 → Bildirim VAR
```

## 🔒 Veri Güvenliği

- **Offline-first**: İnternet bağlantısı gerektirmez
- **Cihaz-bazlı**: Veriler sadece cihazda saklanır
- **Yedekleme**: Kullanıcı kontrolünde JSON export
- **Transaction**: Tüm veritabanı işlemleri transactional

## 🚀 Deployment

### Expo Go ile Test (Development)
```bash
cd frontend
expo start --tunnel
```
Mobil cihazda Expo Go ile QR kodu tara

### APK Build (Production)
```bash
eas build --platform android --profile production
```

## 📋 Kabul Kriterleri (Tümü Geçti ✅)

- ✅ Ana ekran: 4 kart + bildirim zili
- ✅ "Üretim Süreçleri" kartı mevcut
- ✅ Stok formu: Tüm etiketler var, Tedarikçi free-text
- ✅ WAvg maliyet: Doğru hesaplanıyor
- ✅ Ürün seçimi: State korunuyor, edit modunda yükleniyor, kontrast OK
- ✅ Üret akışı: Müşteri formu etiketli, stok düşüyor, kritik bildirim çalışıyor
- ✅ Müşteri: Düzenle/Sil sorunsuz
- ✅ Bildirim: Badge, sheet, tümünü okundu
- ✅ Ayarlar: Yedek Al/Paylaş/Yükle (merge) transactional
- ✅ Build: Hatasız

## 🐛 Bilinen Sınırlamalar

1. **Web Desteği Yok**: SQLite web'de çalışmaz, sadece iOS/Android
2. **Barkod Yok**: Tasarım gereği barkod/kamera desteği eklenmedi
3. **Bulut Sync Yok**: Offline-first, cihaz bazlı çalışır
4. **Push Notification Yok**: Sadece in-app bildirimler

## 📞 Destek

Bu uygulama Emergent AI tarafından, verilen teknik şartnameye göre oluşturulmuştur.

---

**Son Güncelleme**: 2025-01-22
**Versiyon**: 1.0.0
**Platform**: Android (iOS uyumlu)
**Dil**: Türkçe
