-- 초기 데이터 삽입

-- 메뉴 데이터 삽입 (중복 체크: 같은 이름의 메뉴가 이미 있는지 확인)
INSERT INTO menus (name, description, price, image_url, stock)
SELECT '아메리카노(ICE)', '깔끔하고 부드러운 아이스 아메리카노', 4000, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&h=400&fit=crop', 10
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name = '아메리카노(ICE)');

INSERT INTO menus (name, description, price, image_url, stock)
SELECT '아메리카노(HOT)', '따뜻하고 진한 핫 아메리카노', 4000, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', 10
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name = '아메리카노(HOT)');

INSERT INTO menus (name, description, price, image_url, stock)
SELECT '카페라떼', '부드러운 우유와 에스프레소의 조화', 5000, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop', 10
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name = '카페라떼');

INSERT INTO menus (name, description, price, image_url, stock)
SELECT '카푸치노', '에스프레소와 부드러운 우유 거품', 5000, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop', 10
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name = '카푸치노');

INSERT INTO menus (name, description, price, image_url, stock)
SELECT '바닐라라떼', '달콤한 바닐라 시럽이 들어간 라떼', 5500, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&h=400&fit=crop', 10
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE name = '바닐라라떼');

-- 옵션 데이터 삽입 (모든 메뉴에 공통 옵션 추가)
-- 각 메뉴에 "샷 추가"와 "시럽 추가" 옵션 추가
-- 중복 체크: 같은 메뉴에 같은 이름의 옵션이 이미 있는지 확인
-- NOT EXISTS를 사용하므로 ON CONFLICT가 없어도 안전하게 처리됨
INSERT INTO options (name, price, menu_id)
SELECT '샷 추가', 500, m.id 
FROM menus m
WHERE NOT EXISTS (
    SELECT 1 FROM options o 
    WHERE o.menu_id = m.id AND o.name = '샷 추가'
);

INSERT INTO options (name, price, menu_id)
SELECT '시럽 추가', 0, m.id 
FROM menus m
WHERE NOT EXISTS (
    SELECT 1 FROM options o 
    WHERE o.menu_id = m.id AND o.name = '시럽 추가'
);

