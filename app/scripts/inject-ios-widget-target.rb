#!/usr/bin/env ruby
# frozen_string_literal: true

# ==============================================================================
# Treegoh iOS WidgetKit Target Injector (via CocoaPods Xcodeproj)
# ==============================================================================
# Inyecta el target nativo "TreegohWidgetExtension" (.appex) dentro de
# app/ios/Treegoh.xcodeproj tras ejecutar `npx expo prebuild --platform ios`
# para que iOS registre los widgets de Treegoh en la galería de Pantalla de Inicio
# y Pantalla de Bloqueo (estilo Duolingo y Spotify).
# ==============================================================================

require 'xcodeproj'
require 'fileutils'

app_dir = File.expand_path('..', __dir__)
ios_dir = File.join(app_dir, 'ios')
proj_path = File.join(ios_dir, 'Treegoh.xcodeproj')
widget_src_dir = File.join(app_dir, 'ios-widget')
widget_dest_dir = File.join(ios_dir, 'TreegohWidgetExtension')

unless File.exist?(proj_path)
  puts "[TreegohWidget] No se encontró #{proj_path}, omitiendo inyección."
  exit 0
end

FileUtils.mkdir_p(widget_dest_dir)
FileUtils.cp(File.join(widget_src_dir, 'TreegohSanctuaryWidget.swift'), File.join(widget_dest_dir, 'TreegohSanctuaryWidget.swift'))
FileUtils.cp(File.join(widget_src_dir, 'Info.plist'), File.join(widget_dest_dir, 'Info.plist'))

project = Xcodeproj::Project.open(proj_path)
main_target = project.targets.find { |t| t.name == 'Treegoh' } || project.targets.first

existing_widget = project.targets.find { |t| t.name == 'TreegohWidgetExtension' }
if existing_widget
  puts "[TreegohWidget] El target TreegohWidgetExtension ya existe en Treegoh.xcodeproj."
  exit 0
end

puts "[TreegohWidget] Creando target nativo TreegohWidgetExtension en #{proj_path}..."

widget_target = project.new_target(:app_extension, 'TreegohWidgetExtension', :ios, '16.0')

# Crear grupo en el árbol del proyecto Xcode
widget_group = project.main_group.find_subpath('TreegohWidgetExtension', true)
widget_group.set_source_tree('<group>')
widget_group.set_path('TreegohWidgetExtension')

swift_file_ref = widget_group.new_file('TreegohSanctuaryWidget.swift')
widget_group.new_file('Info.plist')

widget_target.source_build_phase.add_file_reference(swift_file_ref, true)

# Enlazar WidgetKit y SwiftUI
['WidgetKit', 'SwiftUI'].each do |fw_name|
  fw_ref = project.frameworks_group.new_reference("System/Library/Frameworks/#{fw_name}.framework")
  fw_ref.name = "#{fw_name}.framework"
  fw_ref.source_tree = 'SDKROOT'
  widget_target.frameworks_build_phase.add_file_reference(fw_ref, true)
end

# Leer versión del target principal para que coincida exactamente (requisito de App Store Connect)
main_build_settings = main_target.build_configurations.first.build_settings
marketing_version = main_build_settings['MARKETING_VERSION'] || '1.0.0'
project_version = main_build_settings['CURRENT_PROJECT_VERSION'] || '2'

widget_target.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.treegoh.app.TreegohWidget'
  s['INFOPLIST_FILE'] = 'TreegohWidgetExtension/Info.plist'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['SWIFT_VERSION'] = '5.0'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
  s['TARGETED_DEVICE_FAMILY'] = '1,2'
  s['SKIP_INSTALL'] = 'YES'
  s['DEVELOPMENT_TEAM'] = '855K4HU668'
  s['MARKETING_VERSION'] = marketing_version
  s['CURRENT_PROJECT_VERSION'] = project_version
  s['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
  s['CLANG_ENABLE_MODULES'] = 'YES'
  s['SWIFT_OPTIMIZATION_LEVEL'] = config.name == 'Release' ? '-O' : '-Onone'
end

# Añadir dependencia y fase "Embed App Extensions" (dst_subfolder_spec = 13 -> PlugIns) en Treegoh
main_target.add_dependency(widget_target)

embed_phase = main_target.copy_files_build_phases.find { |p| p.dst_subfolder_spec == '13' }
unless embed_phase
  embed_phase = main_target.new_copy_files_build_phase('Embed Foundation Extensions')
  embed_phase.dst_subfolder_spec = '13'
end

build_file = embed_phase.add_file_reference(widget_target.product_reference, true)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts "[TreegohWidget] Target TreegohWidgetExtension inyectado y embebido correctamente en Treegoh.app/PlugIns."
