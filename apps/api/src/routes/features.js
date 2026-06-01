import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';

const router = express.Router();

const FEATURE_LIMITS = {
  gratis: 5,
  pro: 50,
  enterprise: Infinity,
};

// POST /validate-feature-limit
router.post('/validate-feature-limit', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // Fetch user's plan from users collection
  const user = await pb.collection('users').getOne(userId);
  const plan = user.plan || 'gratis';

  // Get the limit for this plan
  const limit = FEATURE_LIMITS[plan] ?? 5; // Default to gratis limit if plan not found

  // Count current clients using getList with pagination
  const clientsResult = await pb.collection('clientes').getList(1, 1, {
    filter: `usuario_id="${userId}"`,
  });

  const current = clientsResult.totalItems;
  const allowed = current < limit;

  res.json({
    allowed,
    current,
    limit: limit === Infinity ? -1 : limit, // Return -1 for unlimited
  });
});

export default router;