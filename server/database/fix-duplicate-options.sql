-- 중복 옵션 삭제 스크립트
-- 같은 메뉴에 같은 이름의 옵션이 여러 개인 경우, 가장 오래된 것(id가 가장 작은 것)만 남기고 나머지 삭제

-- 중복 옵션 확인
SELECT menu_id, name, COUNT(*) as count, ARRAY_AGG(id ORDER BY id) as option_ids
FROM options
GROUP BY menu_id, name
HAVING COUNT(*) > 1;

-- 중복 옵션 삭제 (가장 오래된 것만 남김)
DELETE FROM options
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY menu_id, name ORDER BY id) as rn
        FROM options
    ) t
    WHERE rn > 1
);

-- 확인: 중복이 없는지 체크
SELECT menu_id, name, COUNT(*) as count
FROM options
GROUP BY menu_id, name
HAVING COUNT(*) > 1;
-- 결과가 없으면 성공!

