export type Material = {
    id: number;
    material_code: number;
    material_desc: string;
    detail: string | null;
    uom: string;
    average_price: number | null;
    remark: string | null;
    is_removed: number
}