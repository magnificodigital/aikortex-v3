import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '@supabase/supabase-js/cors'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders })
  }

  const event = body.event
  const payment = body.payment

  if (!event) {
    return new Response(JSON.stringify({ error: 'Missing event' }), { status: 400, headers: corsHeaders })
  }

  switch (event) {
    case 'PAYMENT_RECEIVED': {
      if (!payment?.subscription) break

      // Check template subscription
      const { data: sub } = await supabase
        .from('client_template_subscriptions')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription)
        .single()

      if (sub) {
        await supabase.from('billing_events').insert({
          agency_id: sub.agency_id,
          client_id: sub.client_id,
          subscription_id: sub.id,
          event_type: 'payment_received',
          amount: payment.value,
          platform_amount: sub.platform_price_monthly,
          agency_amount: Number(sub.agency_price_monthly) - Number(sub.platform_price_monthly),
          asaas_payment_id: payment.id,
          description: `Pagamento recebido - ${payment.description ?? ''}`
        })

        await supabase
          .from('client_template_subscriptions')
          .update({ status: 'active', asaas_subscription_status: 'ACTIVE' })
          .eq('id', sub.id)
      }

      // Check platform subscription
      const { data: client } = await supabase
        .from('agency_clients')
        .select('*')
        .eq('platform_subscription_id', payment.subscription)
        .single()

      if (client) {
        await supabase
          .from('agency_clients')
          .update({ platform_subscription_status: 'active' })
          .eq('id', client.id)

        await supabase.from('billing_events').insert({
          agency_id: client.agency_id,
          client_id: client.id,
          event_type: 'payment_received',
          amount: payment.value,
          platform_amount: 47,
          agency_amount: Number(payment.value) - 47,
          asaas_payment_id: payment.id,
          description: 'Plataforma mensal'
        })
      }

      break
    }

    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_DELETED': {
      if (!payment?.subscription) break

      await supabase
        .from('client_template_subscriptions')
        .update({ status: 'suspended', asaas_subscription_status: 'OVERDUE' })
        .eq('asaas_subscription_id', payment.subscription)

      await supabase
        .from('agency_clients')
        .update({ platform_subscription_status: 'suspended' })
        .eq('platform_subscription_id', payment.subscription)

      break
    }

    case 'SUBSCRIPTION_DELETED': {
      const subscriptionId = body.subscription?.id
      if (subscriptionId) {
        await supabase
          .from('client_template_subscriptions')
          .update({ status: 'cancelled' })
          .eq('asaas_subscription_id', subscriptionId)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
