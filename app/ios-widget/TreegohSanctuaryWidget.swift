//
//  TreegohSanctuaryWidget.swift
//  TreegohWidgetExtension — iOS WidgetKit (Home Screen & Lock Screen)
//
//  Soporta 4 familias de widgets nativos de iOS estilo Duolingo y Spotify
//  con compatibilidad completa para iOS 16, iOS 17 y iOS 18+ (containerBackground):
//  - systemSmall (2x2): Racha Botánica Duolingo + Estado de Riego
//  - systemMedium (4x2): Radar del Santuario estilo Spotify + Próximas especies
//  - accessoryCircular (Lock Screen): Anillo de Racha del Santuario
//  - accessoryRectangular (Lock Screen): Próximo riego e hidratación en pantalla de bloqueo
//
//  Cumplimiento estricto: Cero emojis. Tipografía institucional limpia.
//

import WidgetKit
import SwiftUI

struct SanctuaryWidgetData: Codable {
    let sanctuaryName: String
    let streakDays: Int
    let streakTitle: String
    let duoMessageTitle: String
    let duoMessageBody: String
    let urgency: String
    let pendingWateringsCount: Int
    let pendingOtherCount: Int
    let nextWateringPlantName: String
    let nextWateringSpaceName: String
    let nextWateringDays: Int
    let totalPlantsCount: Int
    let temperatureCelsius: Int?
    let widgetTheme: String?

    static let placeholder = SanctuaryWidgetData(
        sanctuaryName: "Salón Principal",
        streakDays: 7,
        streakTitle: "Sembrador Constante",
        duoMessageTitle: "Santuario en equilibrio",
        duoMessageBody: "Tus hojas mantienen su turgencia y humedad óptima hoy.",
        urgency: "optimo",
        pendingWateringsCount: 0,
        pendingOtherCount: 1,
        nextWateringPlantName: "Monstera Deliciosa",
        nextWateringSpaceName: "Salón Principal",
        nextWateringDays: 2,
        totalPlantsCount: 12,
        temperatureCelsius: 22,
        widgetTheme: "clorofila_nocturna"
    )
}

struct SanctuaryTimelineEntry: TimelineEntry {
    let date: Date
    let data: SanctuaryWidgetData
}

struct SanctuaryTimelineProvider: TimelineProvider {
    private let appGroupId = "group.com.treegoh.app"
    private let payloadKey = "treegoh_sanctuary_widget_payload"

    func placeholder(in context: Context) -> SanctuaryTimelineEntry {
        SanctuaryTimelineEntry(date: Date(), data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SanctuaryTimelineEntry) -> Void) {
        completion(SanctuaryTimelineEntry(date: Date(), data: loadFromSharedDefaults()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SanctuaryTimelineEntry>) -> Void) {
        let entry = SanctuaryTimelineEntry(date: Date(), data: loadFromSharedDefaults())
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
        completion(timeline)
    }

    private func loadFromSharedDefaults() -> SanctuaryWidgetData {
        if let sharedDefaults = UserDefaults(suiteName: appGroupId),
           let jsonString = sharedDefaults.string(forKey: payloadKey),
           let jsonData = jsonString.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(SanctuaryWidgetData.self, from: jsonData) {
            return decoded
        }
        if let standardJson = UserDefaults.standard.string(forKey: payloadKey),
           let jsonData = standardJson.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(SanctuaryWidgetData.self, from: jsonData) {
            return decoded
        }
        return .placeholder
    }
}

extension View {
    @ViewBuilder
    func treegohContainerBackground<BG: View>(@ViewBuilder backgroundView: () -> BG) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(for: .widget) {
                backgroundView()
            }
        } else {
            self.padding(14)
                .background(backgroundView())
        }
    }
}

// MARK: - Vista Widget Pequeño (2x2 — Estilo Duolingo Racha & Estado)
struct TreegohSmallWidgetView: View {
    let data: SanctuaryWidgetData

    var isSalviaTheme: Bool {
        data.widgetTheme == "salvia_duolingo"
    }

    var isUrgent: Bool {
        data.urgency == "urgente" || data.pendingWateringsCount > 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("treegöh")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08) : Color(red: 0.90, green: 0.91, blue: 0.77))

                Spacer()

                Text("\(data.streakDays) d")
                    .font(.system(size: 11, weight: .medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(
                        Capsule()
                            .fill(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.12) : Color(red: 0.53, green: 0.94, blue: 0.67).opacity(0.18))
                    )
                    .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08) : Color(red: 0.53, green: 0.94, blue: 0.67))
            }

            Spacer(minLength: 2)

            Text(data.duoMessageTitle)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08) : .white)
                .lineLimit(1)

            Text(isUrgent ? "\(data.nextWateringPlantName) pide riego hoy" : "Próximo: \(data.nextWateringPlantName) (\(data.nextWateringDays)d)")
                .font(.system(size: 11.5, weight: .light))
                .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.75) : Color.white.opacity(0.72))
                .lineLimit(2)

            Spacer(minLength: 2)

            HStack(spacing: 5) {
                Circle()
                    .fill(isUrgent ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color(red: 0.53, green: 0.94, blue: 0.67))
                    .frame(width: 6, height: 6)

                Text("\(data.sanctuaryName) · \(data.totalPlantsCount) plantas")
                    .font(.system(size: 10, weight: .light))
                    .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.65) : Color.white.opacity(0.58))
                    .lineLimit(1)
            }
        }
        .treegohContainerBackground {
            LinearGradient(
                colors: isSalviaTheme
                    ? [Color(red: 0.90, green: 0.91, blue: 0.77), Color(red: 0.84, green: 0.88, blue: 0.72)]
                    : [Color(red: 0.04, green: 0.09, blue: 0.06), Color(red: 0.07, green: 0.16, blue: 0.11)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Vista Widget Mediano (4x2 — Estilo Spotify / Duolingo Dashboard)
struct TreegohMediumWidgetView: View {
    let data: SanctuaryWidgetData

    var isUrgent: Bool {
        data.urgency == "urgente" || data.pendingWateringsCount > 0
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text("treegöh")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(Color(red: 0.90, green: 0.91, blue: 0.77))

                    Text("· \(data.streakDays) días")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(red: 0.53, green: 0.94, blue: 0.67))
                }

                Spacer(minLength: 2)

                Text(data.duoMessageTitle)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(data.duoMessageBody)
                    .font(.system(size: 11.5, weight: .light))
                    .foregroundColor(Color.white.opacity(0.74))
                    .lineLimit(2)

                Spacer(minLength: 2)

                Text("\(data.sanctuaryName) · \(data.temperatureCelsius ?? 22)°C")
                    .font(.system(size: 10.5, weight: .light))
                    .foregroundColor(Color(red: 0.90, green: 0.91, blue: 0.77).opacity(0.8))
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(isUrgent ? "RIEGO URGENTE HOY" : "PRÓXIMO RIEGO")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(isUrgent ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color(red: 0.53, green: 0.94, blue: 0.67))

                    Text(data.nextWateringPlantName)
                        .font(.system(size: 12.5, weight: .regular))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Text(isUrgent ? "Hidratar sustrato hoy" : "En \(data.nextWateringDays) días · \(data.nextWateringSpaceName)")
                        .font(.system(size: 10, weight: .light))
                        .foregroundColor(Color.white.opacity(0.65))
                        .lineLimit(1)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.white.opacity(0.08))
                )

                HStack {
                    Text("\(data.totalPlantsCount) especies")
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(Color.white.opacity(0.82))

                    Spacer()

                    Text(data.pendingWateringsCount > 0 ? "\(data.pendingWateringsCount) sedientas" : "Al día")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(data.pendingWateringsCount > 0 ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color(red: 0.53, green: 0.94, blue: 0.67))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.white.opacity(0.06))
                )
            }
            .frame(width: 140)
        }
        .treegohContainerBackground {
            LinearGradient(
                colors: [
                    Color(red: 0.04, green: 0.09, blue: 0.06),
                    Color(red: 0.07, green: 0.16, blue: 0.11)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - Vistas para Pantalla de Bloqueo de iOS (Lock Screen)
@available(iOSApplicationExtension 16.0, *)
struct TreegohLockScreenCircularView: View {
    let data: SanctuaryWidgetData

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 1) {
                Text("\(data.streakDays)")
                    .font(.system(size: 16, weight: .semibold))
                Text("DÍAS")
                    .font(.system(size: 7.5, weight: .regular))
            }
        }
        .treegohContainerBackground {
            Color.clear
        }
    }
}

@available(iOSApplicationExtension 16.0, *)
struct TreegohLockScreenRectangularView: View {
    let data: SanctuaryWidgetData

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("treegöh · Racha \(data.streakDays)d")
                .font(.system(size: 11, weight: .semibold))
            Text(data.pendingWateringsCount > 0 ? "Riego hoy: \(data.nextWateringPlantName)" : "Próximo: \(data.nextWateringPlantName) (\(data.nextWateringDays)d)")
                .font(.system(size: 11, weight: .regular))
                .lineLimit(1)
            Text("\(data.sanctuaryName) · \(data.totalPlantsCount) plantas")
                .font(.system(size: 10, weight: .light))
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
        .treegohContainerBackground {
            Color.clear
        }
    }
}

struct TreegohSanctuaryWidgetEntryView: View {
    var entry: SanctuaryTimelineProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            TreegohSmallWidgetView(data: entry.data)
        case .systemMedium:
            TreegohMediumWidgetView(data: entry.data)
        case .accessoryCircular:
            if #available(iOSApplicationExtension 16.0, *) {
                TreegohLockScreenCircularView(data: entry.data)
            } else {
                TreegohSmallWidgetView(data: entry.data)
            }
        case .accessoryRectangular:
            if #available(iOSApplicationExtension 16.0, *) {
                TreegohLockScreenRectangularView(data: entry.data)
            } else {
                TreegohSmallWidgetView(data: entry.data)
            }
        default:
            TreegohMediumWidgetView(data: entry.data)
        }
    }
}

@main
struct TreegohSanctuaryWidget: Widget {
    let kind: String = "TreegohSanctuaryWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SanctuaryTimelineProvider()) { entry in
            TreegohSanctuaryWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Treegoh Santuario")
        .description("Racha botánica estilo Duolingo, estado de riego y microclima en tu pantalla de inicio y bloqueo.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
    }
}
