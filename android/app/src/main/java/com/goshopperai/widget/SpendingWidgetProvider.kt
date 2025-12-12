package com.goshopperai.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.goshopperai.R
import org.json.JSONObject
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

/**
 * GoShopperAI Spending Widget
 * Displays monthly spending summary on the home screen
 */
class SpendingWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is created
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }

    companion object {
        private const val PREFS_NAME = "com.goshopperai.widgets"
        private const val SPENDING_KEY = "widget_spending_data"

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_spending)
            
            // Load spending data from SharedPreferences
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val spendingJson = prefs.getString(SPENDING_KEY, null)
            
            if (spendingJson != null) {
                try {
                    val spending = JSONObject(spendingJson)
                    val monthlyTotal = spending.getDouble("monthlyTotal")
                    val monthlyBudget = spending.getDouble("monthlyBudget")
                    val currency = spending.getString("currency")
                    val percentUsed = spending.getDouble("percentUsed")
                    
                    // Format currency
                    val formatter = NumberFormat.getCurrencyInstance(Locale.getDefault())
                    formatter.currency = Currency.getInstance(currency)
                    
                    views.setTextViewText(R.id.widget_amount, formatter.format(monthlyTotal))
                    views.setTextViewText(
                        R.id.widget_budget_text,
                        "sur ${formatter.format(monthlyBudget)}"
                    )
                    views.setTextViewText(
                        R.id.widget_percent,
                        "${percentUsed.toInt()}% du budget"
                    )
                    
                    // Update progress bar
                    views.setProgressBar(
                        R.id.widget_progress,
                        100,
                        minOf(percentUsed.toInt(), 100),
                        false
                    )
                    
                } catch (e: Exception) {
                    views.setTextViewText(R.id.widget_amount, "€0.00")
                    views.setTextViewText(R.id.widget_budget_text, "Aucune donnée")
                    views.setTextViewText(R.id.widget_percent, "")
                }
            } else {
                views.setTextViewText(R.id.widget_amount, "€0.00")
                views.setTextViewText(R.id.widget_budget_text, "Scannez une facture")
                views.setTextViewText(R.id.widget_percent, "")
            }
            
            // Set click intent to open app
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("goshopperai://home"))
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
            
            // Set scan button click
            val scanIntent = Intent(Intent.ACTION_VIEW, Uri.parse("goshopperai://scan"))
            val scanPendingIntent = PendingIntent.getActivity(
                context,
                1,
                scanIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_scan_button, scanPendingIntent)
            
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
