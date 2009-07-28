<?php

class psWidgetFormJQueryTokenAutocompleter extends sfWidgetFormSelectMany
{
  public function configure($options = array(), $attributes = array())
  {
    $this->addOption('choices', array());
    $this->addOption('multiple', true);
    $this->addOption('theme', 'fcbk');
    $this->addOption('init_url');
    $this->addOption('search_url');
    $this->addOption('formatter');
    
    parent::configure($options, $attributes);
  }
  
  public function getJavascripts()
  {
    $javascripts = array(
      '/psToolboxPlugin/js/psWidgetFormJQueryTokenAutocompleter.js'
    );
    
    $theme = $this->getOption('theme', '');
    if ($theme)
    {
      $javascripts[] = "/psToolboxPlugin/ps-wfjta/themes/$theme/js/formatter.js";
    }
    
    return $javascripts;
  }
  
  public function getStylesheets()
  {
    $stylesheets = array();
    
    $theme = $this->getOption('theme', '');
    if ($theme)
    {
      $stylesheets["/psToolboxPlugin/ps-wfjta/themes/$theme/css/style.css"] = 'screen';
    }
    
    return $stylesheets;
  }
  
  protected function getOptionsForSelect($value, $choices)
  {
    $mainAttributes = $this->attributes;
    $this->attributes = array();

    if (!is_array($value))
    {
      $value = array($value);
    }

    $value = array_map('strval', array_values($value));
    $value_set = array_flip($value);
    
    $options = array();
    foreach($value as $option)
    {
      $attributes = array(
        'value' => self::escapeOnce($option),
        'selected' => 'selected'
      );
      $options[] = $this->renderContentTag('option', self::escapeOnce($option), $attributes);
    }
    
    $this->attributes = $mainAttributes;
    
    return $options;
  }
  
  public function render($name, $value = null, $attributes = array(), $errors = array())
  {
    $options = array(
      'select' => '%id%',
      'urls' => array(
        'init' => $this->getOption('init_url', ''), 
        'search' => $this->getOption('search_url', '')
      )
    );
    
    // add formatter
    $theme = $this->getOption('theme', '');
    if ($theme)
    {
      $options['formatter'] = 'psWFJTAFormatter';
    }
    else
    {
      $formatter = $this->getOption('formatter', '');
      if ($formatter)
      {
        $options['formatter'] = $formatter;
      }
    }
    
    // widget id
    $widgetId = '';
    if (isset($attributes['id']))
    {
      $widgetId = sprintf(' id="%s"', $attributes['id']);
      unset($attributes['id']); // dont give the id to parent widget
    }

    $javascript = '<script type="text/javascript">new psWidgetFormJQueryTokenAutocompleter(%options%);</script>';
    
    $html  = "<div$widgetId class=\"ps-wfjta ps-wfjta-empty\">";
    $html .= parent::render($name, $value, $attributes, $errors);
    $html .= "</div>";
    $html .= str_replace('%options%', json_encode($options), $javascript);
    $html  = str_replace('"%id%"', sprintf('jQuery(\'#%s\')', $this->generateId($name)), $html);
    
    return $html;
  }
}
