import express from 'express';

const router = express.Router();

export default function createCarbonRouter(promisePool) {
  // 碳源计算接口
  router.post('/calculate', async (req, res) => {
        console.log('=== /api/calculateCarbon API 调用开始 ===');
        console.log('请求参数:', JSON.stringify(req.body, null, 2));
        try {
            const Q = parseFloat(req.body.flow);
            const C1 = parseFloat(req.body.influent_no3);
            const C2 = parseFloat(req.body.effluent_no3);
            const COD1 = parseFloat(req.body.influent_cod);
            const eta = parseFloat(req.body.cod_ratio) / 100;
            const carbon_type = req.body.carbon_source;
            const S = parseFloat(req.body.safety_factor) / 100;
            const cn_ratio = req.body.cn_ratio ? parseFloat(req.body.cn_ratio) : 4;
    
            console.log('解析后的参数:', {
                Q, C1, C2, COD1, eta, carbon_type, S, cn_ratio
            });
    
            if (carbon_type !== 'sodium_acetate') {
                throw new Error("只能使用液体乙酸钠作为碳源");
            }
    
            const user_cod_concentration = parseFloat(req.body.cod_concentration);
            if (isNaN(user_cod_concentration) || user_cod_concentration <= 0) {
                throw new Error("请输入有效的液体乙酸钠 COD 当量（mg/L）");
            }
    
            if (C1 < C2) {
                throw new Error("进水 NO₃⁻-N 浓度必须大于出水目标浓度");
            }
    
            // 计算过程
            const N_remove = (C1 - C2) * Q;
            const cod_total = N_remove * cn_ratio;
            const cod_available = COD1 * Q * eta;
            const cod_supplement = Math.max(cod_total - cod_available, 0);
    
            console.log('计算结果:', {
                N_remove,
                cod_total,
                cod_available,
                cod_supplement
            });
    
            let result;
            if (cod_supplement <= 0) {
                result = "无需投加碳源（进水 COD 已满足需求）";
            } else {
                const volume = (cod_supplement * 1000) / user_cod_concentration;
                const volume_with_safety = volume * (1 + S);
                result = `液体乙酸钠投加体积: ${volume_with_safety.toFixed(2)} L/d`;
            }
    
            console.log('最终计算结果:', result);
            console.log('=== /api/calculateCarbon API 调用结束 ===');
            res.json({ success: true, result: result });
        } catch (err) {
            console.error('计算过程出错:', err.message);
            res.status(400).json({ success: false, error: err.message });
        }
    });

  return router;
}