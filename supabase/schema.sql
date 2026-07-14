-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  "imageUrl" TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "productId" UUID REFERENCES products(id),
  "productName" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerAddress" TEXT NOT NULL,
  "customerWilaya" TEXT NOT NULL,
  "totalAmount" NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping_rates table
CREATE TABLE shipping_rates (
  wilaya_id TEXT PRIMARY KEY,
  home_price NUMERIC NOT NULL DEFAULT 800,
  desk_price NUMERIC NOT NULL DEFAULT 400
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping_rates
CREATE POLICY "Public shipping_rates are viewable by everyone."
  ON shipping_rates FOR SELECT
  USING ( true );

CREATE POLICY "shipping_rates are updatable by authenticated users only."
  ON shipping_rates FOR ALL
  USING ( auth.role() = 'authenticated' );

-- Create policies for products
CREATE POLICY "Public products are viewable by everyone."
  ON products FOR SELECT
  USING ( true );

CREATE POLICY "Products are insertable/updatable/deletable by authenticated users only."
  ON products FOR ALL
  USING ( auth.role() = 'authenticated' );

-- Create policies for orders
CREATE POLICY "Orders are insertable by everyone."
  ON orders FOR INSERT
  WITH CHECK ( true );

CREATE POLICY "Orders are viewable/updatable/deletable by authenticated users only."
  ON orders FOR ALL
  USING ( auth.role() = 'authenticated' );

-- Set up realtime
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table products;
